
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { verifyServerKey } from '@/lib/serverAuth';
import { getRankFromElo } from "@/lib/rankingSystem";
import { successResponse, errorResponse, validationError, unauthorizedResponse } from '../../../../lib/api-response';

// Input Schema
const playerStatSchema = z.object({
    steam_id: z.string(),
    team: z.number(), // 1 or 2
    kills: z.number().default(0),
    deaths: z.number().default(0),
    headshots: z.number().default(0),
    damage: z.number().default(0),
    mvp: z.number().default(0) // Optional MVP count
});

const requestSchema = z.object({
    server_key: z.string().min(1),
    match_id: z.string().min(1),
    winner: z.enum(['A', 'B', 'DRAW']),
    duration_seconds: z.number().optional(),
    players: z.array(playerStatSchema)
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parseResult = requestSchema.safeParse(body);

        if (!parseResult.success) {
            return validationError(parseResult.error);
        }

        const { server_key, match_id, winner, players } = parseResult.data;

        // 1. Verify Server
        const server = await verifyServerKey(server_key);
        if (!server) return unauthorizedResponse();

        // 2. Find Match
        const match = await prisma.match.findUnique({
            where: { id: match_id },
            include: { players: { include: { user: true } } }
        });

        if (!match) return errorResponse('Match not found', 'MATCH_NOT_FOUND', 404);

        if (match.status === 'COMPLETED') {
            return successResponse({ message: 'Match already completed' });
        }

        // 3. Process Results
        const winningTeam = winner === 'A' ? 'TEAM_A' : winner === 'B' ? 'TEAM_B' : 'DRAW';

        // Transaction to ensure data integrity
        await prisma.$transaction(async (tx) => {
            // A. Update Match Status
            await tx.match.update({
                where: { id: match.id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    winnerTeam: winningTeam,
                    server: {
                        disconnect: true // Disconnect server relation to free it? Or just update status?
                        // Better to keep relation for history but update server status separate
                    }
                }
            });

            // B. Update Server Status
            await tx.gameServer.update({
                where: { id: server.id },
                data: { status: 'AVAILABLE' }
            });

            // C. Calculate Team ELO Changes
            const teamAPlayers = match.players
                .filter(mp => mp.team === 'TEAM_A')
                .map(mp => ({
                    steamId: mp.user.steamId!,
                    currentElo: mp.user.rating
                }));

            const teamBPlayers = match.players
                .filter(mp => mp.team === 'TEAM_B')
                .map(mp => ({
                    steamId: mp.user.steamId!,
                    currentElo: mp.user.rating
                }));

            // Use proper ELO calculation
            const { calculateTeamEloChanges } = await import('@/lib/elo');
            const winnerLetter = winningTeam === 'TEAM_A' ? 'A' : winningTeam === 'TEAM_B' ? 'B' : 'A';
            const eloChanges = winningTeam !== 'DRAW'
                ? calculateTeamEloChanges(teamAPlayers, teamBPlayers, winnerLetter)
                : null;

            console.log('[match-end] ELO Changes calculated:', eloChanges ? 'Yes' : 'Draw - No changes');

            // D. Update Player Stats & ELO
            for (const pStat of players) {
                // Convert plugin team number to backend team string
                // Plugin sends: 1 = Survivors (TEAM_A), 2 = Infected (TEAM_B)
                const pluginTeamString = pStat.team === 1 ? 'TEAM_A' : 'TEAM_B';

                // Find match player by SteamID
                const matchPlayer = match.players.find(mp => mp.user.steamId === pStat.steam_id);
                if (!matchPlayer) {
                    console.warn(`[match-end] Player not found in match: ${pStat.steam_id}`);
                    continue;
                }

                // Log if there's a team mismatch (for debugging)
                if (matchPlayer.team !== pluginTeamString) {
                    console.warn(`[match-end] Team mismatch for ${pStat.steam_id}: DB has ${matchPlayer.team}, plugin sent team ${pStat.team} (${pluginTeamString})`);
                }

                // Get ELO change for this player
                const eloData = eloChanges?.all.find(e => e.steamId === pStat.steam_id);
                const newElo = eloData?.newElo || matchPlayer.user.rating;
                const eloChange = eloData?.change || 0;

                // Update MatchPlayer stats
                await tx.matchPlayer.update({
                    where: { id: matchPlayer.id },
                    data: {
                        kills: pStat.kills,
                        deaths: pStat.deaths,
                        headshots: pStat.headshots,
                        damage: pStat.damage,
                        eloChange: eloChange
                    }
                });

                // Update User Global Stats
                const isWinner = (winningTeam === 'TEAM_A' && matchPlayer.team === 'TEAM_A') ||
                    (winningTeam === 'TEAM_B' && matchPlayer.team === 'TEAM_B');

                // Update Rating History
                // Note: user.ratingHistory is typed as Json, cast to number[] safely
                const currentHistory = Array.isArray(matchPlayer.user.ratingHistory)
                    ? matchPlayer.user.ratingHistory as number[]
                    : [];

                // Add new rating to history
                const newHistory = [...currentHistory, newElo];

                // Calculate new Rank based on ELO
                const newRank = getRankFromElo(newElo).name;

                await tx.user.update({
                    where: { id: matchPlayer.userId },
                    data: {
                        wins: { increment: isWinner ? 1 : 0 },
                        losses: { increment: (isWinner || winningTeam === 'DRAW') ? 0 : 1 },
                        rating: newElo,
                        rank: newRank,
                        // Update Aggregates
                        totalKills: { increment: pStat.kills },
                        totalDeaths: { increment: pStat.deaths },
                        totalDamage: { increment: pStat.damage },
                        totalHeadshots: { increment: pStat.headshots },
                        totalMvps: { increment: pStat.mvp || 0 },
                        totalHours: { increment: 1 }, // TODO: Use actual duration
                        ratingHistory: newHistory
                    }
                });

                console.log(`[ELO] ${matchPlayer.user.name}: ${matchPlayer.user.rating} → ${newElo} (${eloChange >= 0 ? '+' : ''}${eloChange})`);
            }

            // D. Cleanup Queue
            await tx.queueEntry.deleteMany({
                where: { matchId: match.id }
            });

            // E. Ensure ALL registered players get ELO changes (even if disconnected)
            // Process players who were in the match but NOT in plugin's player list
            for (const matchPlayer of match.players) {
                const wasInPluginData = players.some(p => p.steam_id === matchPlayer.user.steamId);
                if (!wasInPluginData) {
                    // This player disconnected before match data was collected
                    // Still apply ELO change based on their team's result
                    const eloData = eloChanges?.all.find(e => e.steamId === matchPlayer.user.steamId);
                    const newElo = eloData?.newElo || matchPlayer.user.rating;
                    const eloChange = eloData?.change || 0;

                    const isWinner = (winningTeam === 'TEAM_A' && matchPlayer.team === 'TEAM_A') ||
                        (winningTeam === 'TEAM_B' && matchPlayer.team === 'TEAM_B');

                    // Mark as abandoned
                    await tx.matchPlayer.update({
                        where: { id: matchPlayer.id },
                        data: {
                            eloChange: eloChange,
                            disconnectReason: 'LEFT_BEFORE_END',
                            disconnectedAt: new Date()
                        }
                    });

                    // Still update user rating
                    await tx.user.update({
                        where: { id: matchPlayer.userId },
                        data: {
                            wins: { increment: isWinner ? 1 : 0 },
                            losses: { increment: (isWinner || winningTeam === 'DRAW') ? 0 : 1 },
                            rating: newElo,
                            rank: getRankFromElo(newElo).name
                        }
                    });

                    console.log(`[ELO] ${matchPlayer.user.name} (DISCONNECTED): ${matchPlayer.user.rating} → ${newElo} (${eloChange >= 0 ? '+' : ''}${eloChange})`);
                }
            }
        });

        // F. POST-MATCH SERVER CLEANUP via RCON
        // Runs AFTER transaction to ensure data is saved first
        try {
            const { createRconService } = await import('@/lib/rcon');
            const RCON_PORT = 27015; // Standard Source RCON port

            if (server.rconPassword) {
                console.log('[match-end] Starting server cleanup via RCON...');
                const rcon = createRconService(server.ipAddress, RCON_PORT, server.rconPassword);

                await rcon.connect();

                // 1. Announce match completion
                await rcon.execute('say [L4D2 Ranked] Match complete! Thanks for playing. Resetting server...');

                // 2. Wait a moment for message to display
                await new Promise(resolve => setTimeout(resolve, 3000));

                // 3. Kick all players with message
                await rcon.execute('sm_kick_all "Match Complete - Thanks for playing!"');

                // 4. Clear any ranked whitelist
                await rcon.execute('sm_ranked_clear');

                // 5. Reset to lobby map (Dead Center Chapter 1)
                await rcon.changeMap('c1m1_hotel');

                await rcon.disconnect();
                console.log('[match-end] Server cleanup complete');
            } else {
                console.warn('[match-end] No RCON password - skipping server cleanup');
            }
        } catch (rconError) {
            // Don't fail the whole request if RCON fails - data is already saved
            console.error('[match-end] RCON cleanup failed (non-critical):', rconError);
        }

        return successResponse({ message: 'Match completed successfully' });

    } catch (error) {
        console.error('[API] /server/match-end failed:', error);
        return errorResponse('Internal Server Error', 'INTERNAL_ERROR', 500);
    }
}
