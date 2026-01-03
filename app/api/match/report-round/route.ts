import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface PlayerStat {
    steamId: string;
    damage: number;
    kills: number;
    common: number;
    mvp?: number;
}

export async function POST(request: NextRequest) {
    try {
        const {
            matchId,
            round,
            teamScore,
            healthBonus,
            damageBonus,
            pillsBonus,
            mvpSteamId: rootMvpSteamId, // Rename to distinguish
            playerStats,
        } = await request.json();

        // Validation
        if (!matchId || !round || teamScore === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Determine MVP from playerStats if not in root
        let mvpSteamId = rootMvpSteamId;
        if (!mvpSteamId && playerStats && Array.isArray(playerStats)) {
            const mvpPlayer = (playerStats as PlayerStat[]).find(p => p.mvp && p.mvp > 0);
            if (mvpPlayer) {
                mvpSteamId = mvpPlayer.steamId;
            }
        }

        // Find the match
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                players: { include: { user: true } },
            },
        });

        if (!match) {
            return NextResponse.json(
                { error: 'Match not found' },
                { status: 404 }
            );
        }

        // Get current map name (you might want to pass this from the plugin)
        const mapName = match.selectedMap || match.mapName || 'Unknown';

        // Create round record
        const roundRecord = await prisma.round.create({
            data: {
                matchId,
                roundNumber: round,
                map: mapName,
                teamScore,
                healthBonus,
                damageBonus,
                pillsBonus,
                mvpSteamId,
                endedAt: new Date(),
            } as any,
        });

        // INCREMENT GLOBAL MVP COUNT IMMEDIATELY
        if (mvpSteamId) {
            // Find user by SteamID (via MatchPlayer or directly)
            const mvpUser = match.players.find(p => p.user.steamId === mvpSteamId);
            if (mvpUser) {
                await prisma.user.update({
                    where: { id: mvpUser.userId },
                    data: { totalMvps: { increment: 1 } }
                });
                console.log(`[Round Report] MVP Awarded to ${mvpUser.user.name} for Round ${round}`);
            }
        }

        console.log(`[Round Report] Match ${matchId} - Round ${round} - Score: ${teamScore}`);

        // Save player stats if provided
        if (playerStats && Array.isArray(playerStats)) {
            for (const stat of playerStats as PlayerStat[]) {
                // Find the match player
                const matchPlayer = match.players.find(
                    (p) => p.user.steamId === stat.steamId
                );

                if (matchPlayer) {
                    await prisma.playerRoundStats.create({
                        data: {
                            roundId: roundRecord.id,
                            matchPlayerId: matchPlayer.id,
                            steamId: stat.steamId,
                            damage: stat.damage || 0,
                            kills: stat.kills || 0,
                            common: stat.common || 0,
                        } as any,
                    });
                }
            }
        }

        // Check if this is round 2 (match might be complete)
        const allRounds = await prisma.round.findMany({
            where: { matchId },
            orderBy: { roundNumber: 'asc' },
        });

        // If we have at least 2 rounds, we can potentially complete the match
        // (This will be handled by the complete endpoint, but we log it here)
        if (allRounds.length >= 2) {
            console.log(`[Round Report] Match ${matchId} has ${allRounds.length} rounds completed`);
        }

        return NextResponse.json({
            success: true,
            message: 'Round reported successfully',
            roundId: roundRecord.id,
        });
    } catch (error) {
        console.error('[API] Error in report-round:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
