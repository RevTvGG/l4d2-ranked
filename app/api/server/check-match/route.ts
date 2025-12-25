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
        const text = await request.text();

        try {
            // Try parsing as JSON first
            const json = JSON.parse(text);
            serverKey = json.server_key;
        } catch {
            // If failed, try parsing as URLSearchParams (form data)
            const params = new URLSearchParams(text);
            serverKey = params.get('server_key');
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
