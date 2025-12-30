import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateTeamEloChanges } from '@/lib/elo';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { matchId, steamId, serverKey, reason } = body;

        // Basic validation
        if (!matchId || !steamId) {
            return NextResponse.json({ error: 'Missing matchId or steamId' }, { status: 400 });
        }

        // Find match with all necessary data
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                server: true,
                players: {
                    include: {
                        user: {
                            select: { id: true, rating: true, steamId: true, name: true }
                        }
                    }
                }
            }
        });

        if (!match) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        // Only process if match is in progress
        if (match.status !== 'IN_PROGRESS' && match.status !== 'WAITING_FOR_PLAYERS') {
            return NextResponse.json({ error: 'Match is not active' }, { status: 400 });
        }

        // Verify server key (optional security layer)
        if (serverKey && serverKey !== match.server?.rconPassword && serverKey !== process.env.SERVER_API_KEY) {
            console.warn('[FORFEIT] Invalid server key, but proceeding for now');
        }

        console.log(`[FORFEIT] Processing forfeit for match ${matchId} due to player ${steamId}`);

        // 1. Identify the abandoning player
        const abandoningPlayer = match.players.find(p => p.user?.steamId === steamId);
        if (!abandoningPlayer) {
            return NextResponse.json({ error: 'Player not found in match' }, { status: 404 });
        }

        // 2. Identify teams
        const abandoningTeam = abandoningPlayer.team;
        const winnerTeam = abandoningTeam === 'A' ? 'B' : 'A';

        const teamA = match.players.filter(p => p.team === 'A');
        const teamB = match.players.filter(p => p.team === 'B');

        // 3. Prepare player data for ELO calculation
        const teamAPlayers = teamA.map(p => ({
            steamId: p.user?.steamId || p.id,
            currentElo: p.user?.rating || 1000
        }));

        const teamBPlayers = teamB.map(p => ({
            steamId: p.user?.steamId || p.id,
            currentElo: p.user?.rating || 1000
        }));

        // 4. Calculate ELO changes (winner gets +, loser gets -)
        const eloResult = calculateTeamEloChanges(teamAPlayers, teamBPlayers, winnerTeam as 'A' | 'B');

        // 5. Update ELO for all players
        const updatePromises: Promise<unknown>[] = [];

        for (const change of eloResult.all) {
            // Find the player by steam ID
            const player = match.players.find(p => p.user?.steamId === change.steamId);
            if (player?.user) {
                const isWinner = (player.team === winnerTeam);
                updatePromises.push(
                    prisma.user.update({
                        where: { id: player.user.id },
                        data: {
                            rating: change.newElo,
                            wins: isWinner ? { increment: 1 } : undefined,
                            losses: !isWinner ? { increment: 1 } : undefined
                        }
                    })
                );
                updatePromises.push(
                    prisma.matchPlayer.update({
                        where: { id: player.id },
                        data: { eloChange: change.change }
                    })
                );
            }
        }

        await Promise.all(updatePromises);

        // 6. Mark match as completed
        await prisma.match.update({
            where: { id: matchId },
            data: {
                status: 'COMPLETED',
                endTime: new Date(),
            }
        });

        // 7. Free up the server
        if (match.serverId) {
            await prisma.gameServer.update({
                where: { id: match.serverId },
                data: {
                    status: 'AVAILABLE'
                }
            });
        }

        // 8. Ban the abandoning player
        const reasonText = reason || 'Abandoning match (timeout)';

        await prisma.ban.create({
            data: {
                userId: abandoningPlayer.userId,
                reason: reasonText,
                expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours ban
                active: true
            }
        });

        // Increment user's ban count
        await prisma.user.update({
            where: { id: abandoningPlayer.userId },
            data: { banCount: { increment: 1 } }
        });

        console.log(`[FORFEIT] Match ${matchId} forfeited. Winner: Team ${winnerTeam}. Abandoner banned.`);

        return NextResponse.json({
            success: true,
            message: 'Match forfeited due to player abandonment',
            winnerTeam,
            eloChanges: eloResult.all,
            abandonedBy: steamId
        });

    } catch (error) {
        console.error('[FORFEIT] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
