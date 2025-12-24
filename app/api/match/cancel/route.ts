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

        // Optional: Return players to queue
        // This could be implemented based on the cancel reason

        return successResponse({
            message: 'Match cancelled successfully',
            reason
        });

    } catch (error) {
        console.error('Match cancel error:', error);
        return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }
}
