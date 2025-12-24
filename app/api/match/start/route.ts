import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyServerKey, errorResponse, successResponse } from '@/lib/serverAuth';

/**
 * POST /api/match/start
 * Server notifies when match actually starts
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { matchId, serverKey, serverIp, serverPort, timestamp } = body;

        // Verify server authentication
        const server = await verifyServerKey(serverKey);
        if (!server) {
            return errorResponse('Invalid server key', 'UNAUTHORIZED', 401);
        }

        // Find match
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                players: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
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

        // Check if match is in correct state
        if (match.status !== 'READY') {
            return errorResponse(
                `Match is not ready to start (current status: ${match.status})`,
                'INVALID_STATE',
                409
            );
        }

        // Update match status
        const updatedMatch = await prisma.match.update({
            where: { id: matchId },
            data: {
                status: 'IN_PROGRESS',
                serverIp,
                serverPort,
                startedAt: new Date(timestamp)
            },
            include: {
                players: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                steamId: true,
                                rating: true
                            }
                        }
                    }
                }
            }
        });

        return successResponse({
            match: {
                id: updatedMatch.id,
                status: updatedMatch.status,
                mapName: updatedMatch.mapName,
                players: updatedMatch.players.map(p => ({
                    steamId: p.user.steamId,
                    name: p.user.name,
                    team: p.team,
                    rating: p.user.rating
                }))
            }
        });

    } catch (error) {
        console.error('Match start error:', error);
        return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }
}
