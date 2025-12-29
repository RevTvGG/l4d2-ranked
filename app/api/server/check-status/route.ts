import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/server/check-status
 * 
 * Called by the plugin when it loads (after ZoneMod reloads).
 * Returns any pending/active match assigned to this server.
 * 
 * Query params:
 *   - server_key: The server's authentication key
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const serverKey = searchParams.get('server_key');

        if (!serverKey) {
            return NextResponse.json(
                { error: 'MISSING_SERVER_KEY', message: 'server_key is required' },
                { status: 400 }
            );
        }

        // Find the server by key
        const server = await prisma.gameServer.findFirst({
            where: { serverKey }
        });

        if (!server) {
            return NextResponse.json(
                { error: 'INVALID_SERVER_KEY', message: 'Server not found' },
                { status: 401 }
            );
        }

        // Find any match assigned to this server that is READY or IN_PROGRESS
        const activeMatch = await prisma.match.findFirst({
            where: {
                serverId: server.id,
                status: { in: ['READY', 'IN_PROGRESS'] }
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

        if (!activeMatch) {
            // No pending match - server is free
            return NextResponse.json({
                has_match: false,
                match_id: null,
                message: 'No active match assigned to this server'
            });
        }

        // Return match info so the plugin can configure itself
        return NextResponse.json({
            has_match: true,
            match_id: activeMatch.id,
            map: activeMatch.selectedMap || activeMatch.mapName,
            status: activeMatch.status,
            players: activeMatch.players.map((p) => ({
                steam_id: p.user.steamId,
                name: p.user.name,
                team: p.team
            }))
        });

    } catch (error) {
        console.error('[check-status] Error:', error);
        return NextResponse.json(
            { error: 'INTERNAL_ERROR', message: 'Failed to check server status' },
            { status: 500 }
        );
    }
}
