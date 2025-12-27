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

            // Load ranked config (forces ZoneMod)
            const configResult = await rcon.execute('exec ranked.cfg');
            if (!configResult.success) {
                throw new Error(`Failed to load ranked.cfg: ${configResult.error}`);
            }
            console.log('[RCON] Loaded ranked.cfg with ZoneMod');

            // Wait for config to apply
            await new Promise((resolve) => setTimeout(resolve, 3000));

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

            // Set match whitelist with real player SteamIDs
            const whitelistCmd = `sm_set_match_players ${matchId} ${steamIds.join(' ')}`;
            const whitelistResult = await rcon.execute(whitelistCmd);
            if (!whitelistResult.success) {
                throw new Error(`Failed to set whitelist: ${whitelistResult.error}`);
            }
            console.log(`[RCON] Whitelist set for ${steamIds.length} players`);

            // Set team assignments
            const teamAPlayers = match.players.filter(p => p.team === 'TEAM_A');
            const teamBPlayers = match.players.filter(p => p.team === 'TEAM_B');

            const teamASteamIds = teamAPlayers.map(p => p.user.steamId).filter(Boolean).join(' ');
            const teamBSteamIds = teamBPlayers.map(p => p.user.steamId).filter(Boolean).join(' ');

            // Verify team assignment plugin is loaded
            const pluginsResult = await rcon.execute('sm plugins list');
            const hasTeamPlugin = pluginsResult.success && pluginsResult.output.includes('L4D2 Auto Team Assignment');

            if (!hasTeamPlugin) {
                console.warn('[RCON] ⚠️ Team assignment plugin not loaded, teams will need manual assignment');
            } else {
                const teamsCmd = `sm_set_teams ${matchId} ${teamASteamIds} | ${teamBSteamIds}`;
                const teamsResult = await rcon.execute(teamsCmd);
                if (!teamsResult.success) {
                    console.warn(`[RCON] Warning: Team assignment failed: ${teamsResult.error}`);
                } else {
                    console.log(`[RCON] ✓ Teams assigned: ${teamAPlayers.length} vs ${teamBPlayers.length}`);
                }
            }

            // Set match ID for reporter and autoload
            const apiUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            const matchIdResult = await rcon.execute(`sm_set_match_id ${matchId} ${apiUrl}`);
            if (!matchIdResult.success) {
                console.warn(`[RCON] Warning: Match ID may not be set: ${matchIdResult.error}`);
                // Don't throw, match can continue without reporter
            } else {
                console.log(`[RCON] Match ID set: ${matchId}`);
            }

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
