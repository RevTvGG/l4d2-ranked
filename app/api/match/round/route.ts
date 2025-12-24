import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyServerKey, errorResponse, successResponse } from '@/lib/serverAuth';

/**
 * POST /api/match/round
 * Report results of a single round
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { matchId, serverKey, roundNumber, team, score, survivors, infected } = body;

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

        if (match.status !== 'IN_PROGRESS') {
            return errorResponse('Match is not in progress', 'INVALID_STATE', 409);
        }

        // Check if round already exists (prevent duplicates)
        const existingRound = await prisma.round.findFirst({
            where: {
                matchId,
                roundNumber
            }
        });

        if (existingRound) {
            return errorResponse('Round already reported', 'DUPLICATE', 409);
        }

        // Create round record
        const round = await prisma.round.create({
            data: {
                matchId,
                roundNumber,
                team,
                score,
                survivorStats: survivors,
                infectedStats: infected
            }
        });

        return successResponse({
            roundId: round.id,
            roundNumber: round.roundNumber
        });

    } catch (error) {
        console.error('Round report error:', error);
        return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }
}
