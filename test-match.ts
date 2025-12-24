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
