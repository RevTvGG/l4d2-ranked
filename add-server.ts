import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addServer() {
    console.log('🎮 Adding game server...\n');

    try {
        const server = await prisma.gameServer.upsert({
            where: { serverKey: 'ranked-server-k9cc0n0k4rc' },
            update: {
                name: 'L4D2 Ranked Server #1',
                ipAddress: '50.20.249.93',
                port: 9190,
                rconPassword: 'server1rankedonlinexx26',
                isActive: true,
                status: 'AVAILABLE',
            },
            create: {
                port: 9190,
                rconPassword: 'server1rankedonlinexx26',
                rconPort: 9190,
                serverKey: 'ranked-server-k9cc0n0k4rc',
                isActive: true,
                status: 'AVAILABLE',
            },
        });

        console.log('✅ Server added/updated:', server.id);
        console.log('   Name:', server.name);
        console.log('   IP:', server.ipAddress + ':' + server.port);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

addServer();
