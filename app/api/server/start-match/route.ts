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

            // Use sm_forcematch to load ZoneMod and change map in one command
            console.log(`[RCON] Loading ZoneMod and changing to map: ${mapToLoad}`);
            const forceMatchResult = await rcon.execute(`sm_forcematch zonemod ${mapToLoad}`);
            if (!forceMatchResult.success) {
                throw new Error(`Failed to force match: ${forceMatchResult.error}`);
            }
            console.log(`[RCON] Successfully loaded ZoneMod with map: ${mapToLoad}`);

            // Wait for config to load and map to change
            // Wait for config to load and map to change
            console.log('[RCON] Waiting for ZoneMod and map to load (20s)...');
            await new Promise((resolve) => setTimeout(resolve, 20000));

            // Force Reconnect RCON after map change
            console.log('[RCON] Re-establishing connection for Match setup...');
            try {
                try { await rcon.disconnect(); } catch (e) { console.log('[RCON] Disconnect warning:', e); }
                await rcon.connect();
                console.log('[RCON] Reconnected successfully.');
            } catch (reconnectError) {
                console.error('[RCON] Failed to reconnect, checking if socket is still alive...', reconnectError);
                // Try one more time with a fresh instance if needed, or proceed hoping the old one works
            }

            // Set match ID for the reporter plugin
            const apiUrl = process.env.NEXTAUTH_URL;
            if (!apiUrl) {
                throw new Error('NEXTAUTH_URL environment variable is required');
            }

            // Configure plugin API URL first
            console.log('[RCON] Configuring plugin API URL...');
            const urlConfigResult = await rcon.execute(`sm_cvar l4d2_ranked_api_url \"${apiUrl}/api\"`);
            if (!urlConfigResult.success) {
                console.warn(`[RCON] Warning: Failed to set API URL: ${urlConfigResult.error}`);
            } else {
                console.log(`[RCON] Plugin API URL configured: ${apiUrl}/api`);
            }


            // Set match ID with retry logic (Layer 1: Reliability)
            console.log('[RCON] Setting Match ID with retry logic...');
            let matchIdSet = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
                const matchIdResult = await rcon.execute(`sm_set_match_id ${matchId}`);
                if (matchIdResult.success) {
                    console.log(`[RCON] Match ID set successfully on attempt ${attempt}: ${matchId}`);
                    matchIdSet = true;
                    break;
                } else {
                    console.warn(`[RCON] Attempt ${attempt}/3 failed: ${matchIdResult.error}`);
                    if (attempt < 3) {
                        console.log('[RCON] Waiting 5 seconds before retry...');
                        await new Promise((resolve) => setTimeout(resolve, 5000));
                    }
                }
            }

            if (!matchIdSet) {
                console.error(`[RCON] CRITICAL: Failed to set Match ID after 3 attempts. Plugin will auto-query from API.`);
                // Don't throw - plugin has auto-query fallback (Layer 2)
            }



            // Configure player whitelist with retry logic
            console.log('[RCON] Configuring player whitelist...');
            const whitelistCmd = `sm_ranked_whitelist ${steamIds.join(' ')}`;

            let whitelistSet = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
                const whitelistResult = await rcon.execute(whitelistCmd);
                if (whitelistResult.success) {
                    console.log(`[RCON] Whitelist configured on attempt ${attempt} for ${steamIds.length} players`);
                    whitelistSet = true;
                    break;
                } else {
                    console.warn(`[RCON] Whitelist attempt ${attempt}/3 failed: ${whitelistResult.error}`);
                    if (attempt < 3) {
                        await new Promise((resolve) => setTimeout(resolve, 3000));
                    }
                }
            }

            if (!whitelistSet) {
                console.error('[RCON] CRITICAL: Failed to set whitelist after 3 attempts!');
            }

            // Hide server from browser (set visible max players to 8)
            console.log('[RCON] Hiding server from browser...');
            const hideServerResult = await rcon.execute('sv_visiblemaxplayers 8');
            if (hideServerResult.success) {
                console.log('[RCON] Server hidden (sv_visiblemaxplayers 8)');
            } else {
                console.warn(`[RCON] Warning: Failed to hide server: ${hideServerResult.error}`);
            }


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
