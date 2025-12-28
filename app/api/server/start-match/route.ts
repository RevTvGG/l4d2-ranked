import { NextRequest, NextResponse } from 'next/server';
import { createRconService } from '@/lib/rcon';
import { prisma } from '@/lib/prisma';
import { RANKED_MAP_POOL } from '@/lib/constants/maps';

export async function POST(request: NextRequest) {
    try {
        const { matchId } = await request.json();

        if (!matchId) {
            return NextResponse.json(
                { error: 'matchId is required' },
                { status: 400 }
            );
        }

        // Fetch match details with players
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                server: true,
                players: { include: { user: true } },
            },
        });

        if (!match) {
            return NextResponse.json(
                { error: 'Match not found' },
                { status: 404 }
            );
        }

        if (!match.server) {
            return NextResponse.json(
                { error: 'No server assigned to match' },
                { status: 400 }
            );
        }

        if (!match.server.rconPassword) {
            return NextResponse.json(
                { error: 'Server RCON password not configured' },
                { status: 500 }
            );
        }

        if (!match.selectedMap && !match.mapName) {
            return NextResponse.json(
                { error: 'No map selected for match' },
                { status: 400 }
            );
        }

        // Get map code from RANKED_MAP_POOL
        const selectedMapName = match.selectedMap || match.mapName || 'Dark Carnival';
        const mapData = RANKED_MAP_POOL.find(m => m.name === selectedMapName);
        const mapToLoad = mapData?.startMap || 'c2m1_highway'; // Default to Dark Carnival

        // Get player Steam IDs for whitelist
        const steamIds = match.players
            .map((p) => p.user.steamId)
            .filter((id): id is string => !!id);

        if (steamIds.length === 0) {
            return NextResponse.json(
                { error: 'No players with Steam IDs found' },
                { status: 400 }
            );
        }

        // Create RCON connection
        const rcon = createRconService(
            match.server.ipAddress,
            match.server.port,
            match.server.rconPassword
        );

        try {
            // Connect to server
            await rcon.connect();

            // Change to match map
            const mapResult = await rcon.execute(`changelevel ${mapToLoad}`);
            if (!mapResult.success) {
                throw new Error(`Failed to change map: ${mapResult.error}`);
            }
            console.log(`[RCON] Changed map to: ${mapToLoad}`);

            // Disconnect because server will restart
            await rcon.disconnect();
            console.log('[RCON] Disconnected for map change');

            // Wait for map to load completely
            console.log('[RCON] Waiting for map to load...');
            await new Promise((resolve) => setTimeout(resolve, 12000));

            // Reconnect after map loads
            await rcon.connect();
            console.log('[RCON] Reconnected after map change');

            // Set match ID for the reporter plugin
            const apiUrl = process.env.NEXTAUTH_URL;
            if (!apiUrl) {
                throw new Error('NEXTAUTH_URL environment variable is required');
            }

            // Configure plugin API URL first
            console.log('[RCON] Configuring plugin API URL...');
            const urlConfigResult = await rcon.execute(`sm_cvar l4d2_ranked_api_url "${apiUrl}/api"`);
            if (!urlConfigResult.success) {
                console.warn(`[RCON] Warning: Failed to set API URL: ${urlConfigResult.error}`);
            } else {
                console.log(`[RCON] Plugin API URL configured: ${apiUrl}/api`);
            }

            // Set match ID
            const matchIdResult = await rcon.execute(`sm_set_match_id ${matchId}`);
            if (!matchIdResult.success) {
                console.warn(`[RCON] Warning: Match ID may not be set: ${matchIdResult.error}`);
                // Don't throw, match can continue without reporter
            } else {
                console.log(`[RCON] Match ID set: ${matchId}`);
            }

            // Configure player whitelist
            console.log('[RCON] Configuring player whitelist...');

            // Clear any existing whitelist
            await rcon.execute('sm_cvar sv_steamgroup_exclusive 0');

            // Add each player to whitelist
            for (const steamId of steamIds) {
                // Using sm_cvar to set reserved slots (SourceMod native)
                // This prevents non-whitelisted players from joining
                const whitelistResult = await rcon.execute(`sm_reservation_add ${steamId}`);
                if (whitelistResult.success) {
                    console.log(`[RCON] Whitelisted: ${steamId}`);
                } else {
                    console.warn(`[RCON] Failed to whitelist ${steamId}: ${whitelistResult.error}`);
                }
            }

            console.log(`[RCON] Whitelist configured for ${steamIds.length} players`);

            // Update server status to IN_USE
            await prisma.gameServer.update({
                where: { id: match.serverId },
                data: { status: 'IN_USE' }
            });
            console.log('[DB] Server status updated to IN_USE');

            // Disconnect
            await rcon.disconnect();

            // Update match status to WAITING_FOR_PLAYERS (not IN_PROGRESS yet)
            // Match will go IN_PROGRESS when plugin notifies us via /api/match/notify-live
            await prisma.match.update({
                where: { id: matchId },
                data: {
                    status: 'WAITING_FOR_PLAYERS' as any,
                },
            });

            // Return server info so players can connect
            const serverIp = `${match.server.ipAddress}:${match.server.port}`;

            return NextResponse.json({
                success: true,
                message: 'Server ready for players',
                matchId,
                map: mapToLoad,
                serverIp,
                players: steamIds.length,
            });
        } catch (rconError) {
            console.error('[RCON] Error:', rconError);
            await rcon.disconnect();

            return NextResponse.json(
                { error: 'Failed to communicate with game server', details: String(rconError) },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('[API] Error starting match:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
