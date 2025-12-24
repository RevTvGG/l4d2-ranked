import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyServerKey, errorResponse, successResponse } from '@/lib/serverAuth';

/**
 * GET /api/server/check-match
 * Server polls this endpoint to check if there's a match assigned to it
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const serverKey = searchParams.get('serverKey');

        // Verify server authentication
        const server = await verifyServerKey(serverKey || '');
        if (!server) {
            return errorResponse('Invalid server key', 'UNAUTHORIZED', 401);
        }

        // Check if there's a match assigned to this server
        const match = await prisma.match.findFirst({
            where: {
                serverId: server.id,
                status: 'READY' // Match is ready but not started yet
            },
            include: {
                players: {
                    include: {
                        user: {
                            select: {
                                steamId: true,
                                name: true,
                                rating: true
                            }
                        }
                    }
                }
            }
        });

        if (!match) {
            return successResponse({
                hasMatch: false
            });
        }

        // Separate players by team
        const teamA = match.players
            .filter(p => p.team === 1)
            .map(p => ({
                steamId: p.user.steamId,
                name: p.user.name,
                rating: p.user.rating
            }));

        const teamB = match.players
            .filter(p => p.team === 2)
            .map(p => ({
                steamId: p.user.steamId,
                name: p.user.name,
                rating: p.user.rating
            }));

        return successResponse({
            hasMatch: true,
            match: {
                id: match.id,
                mapName: match.mapName || 'c1m1_hotel',
                teamA,
                teamB,
                serverPassword: match.serverPassword || '',
                readyTimeout: 120
            }
        });

    } catch (error) {
        console.error('Check match error:', error);
        return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }
}
