import { NextRequest, NextResponse } from 'next/server';
import { createRconService } from '@/lib/rcon';
import { prisma } from '@/lib/prisma';

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

        const mapToLoad = match.selectedMap || match.mapName || 'c1m1_hotel';

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

            // Set match whitelist (restrict server to match players only)
            const whitelistCmd = `sm_set_match_players ${matchId} ${steamIds.join(' ')}`;
            await rcon.execute(whitelistCmd);
            console.log(`[RCON] Whitelist set for ${steamIds.length} players`);

            // Set match ID for reporter plugin
            const apiUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            await rcon.execute(`sm_set_match_id ${matchId} ${apiUrl}`);
            console.log(`[RCON] Match ID set: ${matchId}`);

            // Announce match
            await rcon.say(`[Ranked] Match ${matchId.substring(0, 8)} starting...`);
            await rcon.say(`[Ranked] ${steamIds.length} players whitelisted`);

            // Execute ranked config (if exists)
            try {
                await rcon.executeConfig('ranked.cfg');
                console.log('[RCON] Loaded ranked.cfg');
            } catch (e) {
                console.log('[RCON] ranked.cfg not found, skipping');
            }

            // Wait for config to load
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Change to match map
            await rcon.changeMap(mapToLoad);
            console.log(`[RCON] Changed map to: ${mapToLoad}`);

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
