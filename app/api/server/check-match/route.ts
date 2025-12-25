import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyServerKey, errorResponse, successResponse } from '@/lib/serverAuth';

/**
 * POST /api/server/check-match
 * Server polls this endpoint to check if there's a match assigned to it
 */
export async function POST(request: NextRequest) {
    try {
        let serverKey: string | null = null;

        // Try parsing JSON first
        if (request.headers.get('content-type')?.includes('application/json')) {
            const body = await request.json();
            serverKey = body.server_key; // Note: plugin uses underscore
        } else {
            // Fallback to FormData (SteamWorks default)
            const formData = await request.formData();
            serverKey = formData.get('server_key') as string;
        }

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
                                name: true
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
                name: p.user.name
            }));

        const teamB = match.players
            .filter(p => p.team === 2)
            .map(p => ({
                steamId: p.user.steamId,
                name: p.user.name
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
