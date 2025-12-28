
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Hardcoded dummy steam IDs for testing
        const STEAM_ID_1 = 'STEAM_1:1:123456789';
        const STEAM_ID_2 = 'STEAM_1:0:987654321';

        // Ensure users exist
        let p1 = await prisma.user.findUnique({ where: { steamId: STEAM_ID_1 } });
        if (!p1) {
            p1 = await prisma.user.create({
                data: {
                    steamId: STEAM_ID_1,
                    name: 'Test Player 1',
                    email: 'test1@example.com',
                    image: 'https://avatars.akamai.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'
                }
            });
        }

        let p2 = await prisma.user.findUnique({ where: { steamId: STEAM_ID_2 } });
        if (!p2) {
            p2 = await prisma.user.create({
                data: {
                    steamId: STEAM_ID_2,
                    name: 'Test Player 2',
                    email: 'test2@example.com',
                    image: 'https://avatars.akamai.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'
                }
            });
        }

        const match = await prisma.match.create({
            data: {
                status: 'WAITING_FOR_PLAYERS',
                selectedMap: 'Dark Carnival',
                // serverId: 'manual_test_server',  <-- REMOVED to avoid FK error
                serverIp: '0.0.0.0',
                serverPort: 27015,
                serverPassword: 'rcon_password',
                players: {
                    create: [
                        { userId: p1.id, team: 'TEAM_A', eloAtStart: 1000 },
                        { userId: p2.id, team: 'TEAM_B', eloAtStart: 1000 }
                    ]
                }
            }
        });

        return NextResponse.json({
            success: true,
            matchId: match.id,
            command: `sm_set_match_id ${match.id} https://www.l4d2ranked.online/api`
        });

    } catch (error) {
        console.error('Error creating test match:', error);
        return NextResponse.json({ success: false, error: 'Failed to create match' }, { status: 500 });
    }
}
