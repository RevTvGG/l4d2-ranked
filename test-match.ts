import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestMatch() {
    console.log('🎮 Creating test match...\n');

    try {
        const server = await prisma.gameServer.findFirst({
            where: { serverKey: 'ranked-server-k9cc0n0k4rc' }
        });

        if (!server) {
            console.error('❌ Server not found!');
            return;
        }

        console.log('✅ Server found:', server.name);

        // Get your user
        const user = await prisma.user.findFirst();

        if (!user) {
            console.error('❌ No users found!');
            return;
        }

        console.log('✅ User found:', user.name);

        console.log('✅ User found:', user.name);

        // CLEANUP: Cancel pending matches to avoid conflicts
        await prisma.match.updateMany({
            where: { status: { in: ['VETO', 'READY', 'IN_PROGRESS'] } },
            data: { status: 'CANCELLED', cancelReason: 'Test script override' }
        });
        console.log('🧹 Cleaned up old matches');

        // Create simple test match
        const match = await prisma.match.create({
            data: {
                serverId: server.id,
                mapName: 'c1m1_hotel',
                status: 'READY',
                serverPassword: 'test123',
                players: {
                    create: [
                        {
                            userId: user.id,
                            team: 1,
                            accepted: true,
                            connected: false
                        }
                    ]
                }
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

        // Create Queue Entry so UI sees it
        await prisma.queueEntry.create({
            data: {
                userId: user.id,
                status: 'MATCHED',
                matchId: match.id,
                mmr: user.rating,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000)
            }
        });

        console.log('\n✅ Test match created!');
        console.log('📋 Match ID:', match.id);
        console.log('📍 Map:', match.mapName);
        console.log('🔑 Password:', match.serverPassword);
        console.log('👥 Player:', match.players[0].user.name);
        console.log('   SteamID:', match.players[0].user.steamId);
        console.log('\n🎮 Plugin should detect this in ~5 seconds!');
        console.log('   Watch server console for: "[Ranked] Match found!"');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestMatch();
