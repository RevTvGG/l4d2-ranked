
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { verifyServerKey } from '@/lib/serverAuth';
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

            // C. Update Player Stats & ELO
            for (const pStat of players) {
                // Find map player
                const matchPlayer = match.players.find(mp => mp.user.steamId === pStat.steam_id);
                if (!matchPlayer) continue;

                // Update MatchPlayer stats
                await tx.matchPlayer.update({
                    where: { id: matchPlayer.id },
                    data: {
                        kills: pStat.kills,
                        deaths: pStat.deaths,
                        headshots: pStat.headshots,
                        damage: pStat.damage,
                        eloChange: 0 // TODO: Calculate ELO
                    }
                });

                // Update User Global Stats
                const isWinner = (winningTeam === 'TEAM_A' && matchPlayer.team === 'TEAM_A') ||
                    (winningTeam === 'TEAM_B' && matchPlayer.team === 'TEAM_B');

                // Simple ELO calc (Placeholder)
                const eloDelta = isWinner ? 25 : -25;
                const newElo = (matchPlayer.user.rating || 1000) + eloDelta;

                await tx.user.update({
                    where: { id: matchPlayer.userId },
                    data: {
                        wins: { increment: isWinner ? 1 : 0 },
                        losses: { increment: isWinner ? 0 : 1 },
                        rating: newElo,
                        totalHours: { increment: 1 } // +1 hour per match (approx)
                    }
                });
            }

            // D. Cleanup Queue
            await tx.queueEntry.deleteMany({
                where: { matchId: match.id }
            });
        });

        return successResponse({ message: 'Match completed successfully' });

    } catch (error) {
        console.error('[API] /server/match-end failed:', error);
        return errorResponse('Internal Server Error', 'INTERNAL_ERROR', 500);
    }
}
