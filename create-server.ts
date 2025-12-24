import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createGameServer() {
    console.log('🎮 Creating game server...\n');

    try {
        const server = await prisma.gameServer.create({
            data: {
                name: 'L4D2 Ranked Server #1',
                ipAddress: '50.20.249.93',
                port: 9190,
                serverKey: `ranked-server-${Math.random().toString(36).substring(2, 18)}`,
                isActive: true,
                status: 'AVAILABLE'
            }
        });

        console.log('✅ Server created successfully!\n');
        console.log('📋 Server Details:');
        console.log('   Name:', server.name);
        console.log('   IP:', server.ipAddress);
        console.log('   Port:', server.port);
        console.log('   Status:', server.status);
        console.log('\n🔑 SERVER KEY (copy this):');
        console.log('   ' + server.serverKey);
        console.log('\n📝 Add this to your l4d2ranked.cfg:');
        console.log(`   "server_key"  "${server.serverKey}"`);

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createGameServer();
