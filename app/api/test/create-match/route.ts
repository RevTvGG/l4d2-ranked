import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        // Get server
        const server = await prisma.gameServer.findUnique({
            where: { serverKey: 'ranked-server-k9cc0n0k4rc' },
        });

        if (!server) {
            return NextResponse.json(
                { error: 'Server not found' },
                { status: 404 }
            );
        }

        // Create test users with Steam IDs
        const testPlayers = [];
        for (let i = 1; i <= 8; i++) {
            const player = await prisma.user.upsert({
                where: { steamId: `STEAM_1:0:${10000 + i}` },
                update: {},
                create: {
                    name: `Test Player ${i}`,
                    steamId: `STEAM_1:0:${10000 + i}`,
                    rating: 1000 + (i * 100),
                },
            });
            testPlayers.push(player);
        }

        // Create test match
        const match = await prisma.match.create({
            data: {
                serverId: server.id,
                status: 'READY',
                selectedMap: 'c2m1_highway',
                mapName: 'c2m1_highway',
                players: {
                    create: testPlayers.map((player, index) => ({
                        userId: player.id,
                        team: index < 4 ? 'TEAM_A' : 'TEAM_B',
                    })),
                },
            },
        });

        return NextResponse.json({
            success: true,
            matchId: match.id,
            map: match.selectedMap,
            players: testPlayers.length,
        });
    } catch (error) {
        console.error('[Create Match] Error:', error);
        return NextResponse.json(
            { error: 'Failed to create match', details: String(error) },
            { status: 500 }
        );
    }
}
