import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyServerKey, errorResponse, successResponse } from '@/lib/serverAuth';
import { calculateTeamEloChanges, applyMvpBonus } from '@/lib/elo';

/**
 * POST /api/match/complete
 * Finalize match and calculate ELO changes
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { matchId, serverKey, winnerTeam, finalScores, mvp } = body;

        // Verify server authentication
        const server = await verifyServerKey(serverKey);
        if (!server) {
            return errorResponse('Invalid server key', 'UNAUTHORIZED', 401);
        }

        // Find match with players
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                players: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                steamId: true,
                                rating: true
                            }
                        }
                    }
                }
            }
        });

        if (!match) {
            return errorResponse('Match not found', 'NOT_FOUND', 404);
        }

        if (match.status === 'COMPLETED') {
            return errorResponse('Match already completed', 'ALREADY_COMPLETED', 409);
        }

        // Separate players by team
        const teamAPlayers = match.players
            .filter(p => p.team === 1)
            .map(p => ({
                steamId: p.user.steamId,
                currentElo: p.user.rating,
                userId: p.user.id
            }));

        const teamBPlayers = match.players
            .filter(p => p.team === 2)
            .map(p => ({
                steamId: p.user.steamId,
                currentElo: p.user.rating,
                userId: p.user.id
            }));

        // Calculate ELO changes
        const eloChanges = calculateTeamEloChanges(
            teamAPlayers,
            teamBPlayers,
            winnerTeam
        );

        // Apply MVP bonus if provided
        if (mvp) {
            const mvpChange = eloChanges.all.find(c => c.steamId === mvp);
            if (mvpChange) {
                const bonusChange = applyMvpBonus(mvpChange.change);
                mvpChange.newElo = mvpChange.oldElo + bonusChange;
                mvpChange.change = bonusChange;
            }
        }

        // Update match status
        await prisma.match.update({
            where: { id: matchId },
            data: {
                status: 'COMPLETED',
                winnerTeam: winnerTeam === 'A' ? match.teamAId : match.teamBId,
                completedAt: new Date()
            }
        });

        // Update player ratings
        for (const change of eloChanges.all) {
            await prisma.user.update({
                where: { steamId: change.steamId },
                data: {
                    rating: change.newElo,
                    wins: winnerTeam === 'A'
                        ? teamAPlayers.some(p => p.steamId === change.steamId) ? { increment: 1 } : undefined
                        : teamBPlayers.some(p => p.steamId === change.steamId) ? { increment: 1 } : undefined,
                    losses: winnerTeam === 'A'
                        ? teamBPlayers.some(p => p.steamId === change.steamId) ? { increment: 1 } : undefined
                        : teamAPlayers.some(p => p.steamId === change.steamId) ? { increment: 1 } : undefined
                }
            });
        }

        return successResponse({
            eloChanges: eloChanges.all,
            finalScores
        });

    } catch (error) {
        console.error('Match complete error:', error);
        return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }
}
