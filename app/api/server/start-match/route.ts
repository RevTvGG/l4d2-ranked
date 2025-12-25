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

            // Change to match map first
            await rcon.execute(`changelevel ${mapToLoad}`);
            console.log(`[RCON] Changed map to: ${mapToLoad}`);

            // Wait for map to load completely
            await new Promise((resolve) => setTimeout(resolve, 8000));

            // Start ZoneMod match menu (equivalent to !match)
            await rcon.execute('sm_match');
            console.log('[RCON] Opened match menu');

            // Wait for menu to appear
            await new Promise((resolve) => setTimeout(resolve, 3000));

            // Select ZoneMod (option 1)
            await rcon.execute('sm_match 1');
            console.log('[RCON] Selected ZoneMod');

            // Wait for version menu
            await new Promise((resolve) => setTimeout(resolve, 3000));

            // Select latest version (option 1)
            await rcon.execute('sm_match 1');
            console.log('[RCON] Selected latest ZoneMod version');

            // Wait for ZoneMod to fully load
            await new Promise((resolve) => setTimeout(resolve, 5000));

            // Set match whitelist
            const whitelistCmd = `sm_set_match_players ${matchId} ${steamIds.join(' ')}`;
            await rcon.execute(whitelistCmd);
            console.log(`[RCON] Whitelist set for ${steamIds.length} players`);

            // Set match ID for reporter
            const apiUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            await rcon.execute(`sm_set_match_id ${matchId} ${apiUrl}`);
            console.log(`[RCON] Match ID set: ${matchId}`);

            // Disconnect
            await rcon.disconnect();

            // Update match status
            await prisma.match.update({
                where: { id: matchId },
                data: {
                    status: 'IN_PROGRESS',
                    startedAt: new Date(),
                },
            });

            return NextResponse.json({
                success: true,
                message: 'Match started successfully',
                matchId,
                map: mapToLoad,
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
