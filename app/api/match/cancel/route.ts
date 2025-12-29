import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyServerKey, errorResponse, successResponse } from '@/lib/serverAuth';

/**
 * POST /api/match/cancel
 * Cancel match (not enough players, server crash, etc.)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { matchId, serverKey, reason } = body;

        // Verify server authentication
        const server = await verifyServerKey(serverKey);
        if (!server) {
            return errorResponse('Invalid server key', 'UNAUTHORIZED', 401);
        }

        // Find match
        const match = await prisma.match.findUnique({
            where: { id: matchId }
        });

        if (!match) {
            return errorResponse('Match not found', 'NOT_FOUND', 404);
        }

        if (match.status === 'COMPLETED' || match.status === 'CANCELLED') {
            return errorResponse('Match already finalized', 'ALREADY_FINALIZED', 409);
        }

        // Update match status
        await prisma.match.update({
            where: { id: matchId },
            data: {
                status: 'CANCELLED',
                cancelReason: reason
            }
        });

        // Get players to kick
        const matchPlayers = await prisma.matchPlayer.findMany({
            where: { matchId },
            include: { user: { select: { steamId: true } } }
        });
        const playersToKick = matchPlayers.map(p => p.user.steamId).filter(Boolean);

        // Free up the server
        if (server.id) {
            await prisma.gameServer.update({
                where: { id: server.id },
                data: { status: 'AVAILABLE' }
            });
        }

        return successResponse({
            message: 'Match cancelled successfully',
            reason,
            playersToKick
        });

    } catch (error) {
        console.error('Match cancel error:', error);
        return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }
}
