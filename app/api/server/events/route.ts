import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAutoBan, cancelMatchAndBanPlayer, forfeitMatchAndBanPlayer } from '@/lib/autoban';

// Events from the plugin:
// - PLAYER_DISCONNECT: Player disconnected from server
// - PLAYER_CONNECT: Player connected to server
// - PLAYER_CRASH: Player timed out (crash detected)
// - MATCH_READY: All players are ready
// - ROUND_END: Round ended

type ServerEvent = 'PLAYER_DISCONNECT' | 'PLAYER_CONNECT' | 'PLAYER_CRASH' | 'NO_JOIN_TIMEOUT';

// Store pending disconnects for grace period
const pendingDisconnects = new Map<string, NodeJS.Timeout>();

export async function POST(request: NextRequest) {
    try {
        // Verify server key
        const authHeader = request.headers.get('Authorization');
        const serverKey = authHeader?.replace('Bearer ', '');

        if (!serverKey) {
            return NextResponse.json({ error: 'Missing server key' }, { status: 401 });
        }

        const server = await prisma.gameServer.findUnique({
            where: { serverKey }
        });

        if (!server) {
            return NextResponse.json({ error: 'Invalid server key' }, { status: 401 });
        }

        const { event, steamId, matchId, reason } = await request.json();

        if (!event || !steamId) {
            return NextResponse.json({ error: 'Missing event or steamId' }, { status: 400 });
        }

        console.log(`[ServerEvent] ${event} from ${steamId} on server ${server.name}`);

        // Get user by steamId
        const user = await prisma.user.findUnique({
            where: { steamId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        switch (event as ServerEvent) {
            case 'PLAYER_DISCONNECT':
            case 'PLAYER_CRASH':
                // Different grace periods based on disconnect type
                // Rage quit (disconnect by user) = 2 minutes
                // Crash (timed out) = 5 minutes
                const graceMinutes = event === 'PLAYER_CRASH' ? 5 : 2;
                const banReason = event === 'PLAYER_CRASH' ? 'NO_REJOIN' : 'RAGE_QUIT';

                // Clear any existing timeout
                if (pendingDisconnects.has(steamId)) {
                    clearTimeout(pendingDisconnects.get(steamId)!);
                }

                // Notify in-game about grace period
                console.log(`[ServerEvent] ${steamId} disconnected (${event}). Grace: ${graceMinutes} min`);

                // Set new timeout
                const timeout = setTimeout(async () => {
                    console.log(`[ServerEvent] Grace period expired for ${steamId} (${banReason})`);

                    if (matchId) {
                        // Forfeit match: winner gets ELO, only quitter loses
                        await forfeitMatchAndBanPlayer(
                            matchId,
                            user.id,
                            banReason as any,
                            reason || `Player ${event === 'PLAYER_CRASH' ? 'crashed and did not rejoin' : 'rage quit'}`
                        );
                    } else {
                        await createAutoBan(
                            user.id,
                            event === 'PLAYER_CRASH' ? 'CRASH' : 'NO_JOIN',
                            matchId,
                            reason || `Player disconnected: ${event}`
                        );
                    }

                    pendingDisconnects.delete(steamId);
                }, graceMinutes * 60 * 1000);

                pendingDisconnects.set(steamId, timeout);

                return NextResponse.json({
                    success: true,
                    message: `Grace period started: ${graceMinutes} minutes (${banReason})`,
                    graceMinutes,
                    banReason
                });

            case 'PLAYER_CONNECT':
                // Player reconnected, cancel pending ban
                if (pendingDisconnects.has(steamId)) {
                    clearTimeout(pendingDisconnects.get(steamId)!);
                    pendingDisconnects.delete(steamId);
                    console.log(`[ServerEvent] ${steamId} reconnected, grace period cancelled`);
                    return NextResponse.json({
                        success: true,
                        message: 'Reconnected, grace period cancelled'
                    });
                }
                return NextResponse.json({ success: true, message: 'Player connected' });

            case 'NO_JOIN_TIMEOUT':
                // Player was assigned to match but never connected
                if (matchId) {
                    await cancelMatchAndBanPlayer(
                        matchId,
                        user.id,
                        'NO_JOIN',
                        'Did not connect to server after match found'
                    );
                    return NextResponse.json({
                        success: true,
                        message: 'Player banned for no-join'
                    });
                }
                return NextResponse.json({ error: 'Match ID required' }, { status: 400 });

            default:
                return NextResponse.json({ error: 'Unknown event' }, { status: 400 });
        }
    } catch (error) {
        console.error('[ServerEvent] Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
