import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanAndAddServer() {
    console.log('🧹 Cleaning old servers and adding correct one...\n');

    try {
        // Delete all existing servers
        const deleted = await prisma.gameServer.deleteMany({});
        console.log(`🗑️  Deleted ${deleted.count} old servers`);

        // Add the correct server
        const server = await prisma.gameServer.create({
            data: {
                serverKey: 'ranked-server-main',
                name: 'L4D2 Ranked Server #1',
                ipAddress: '50.20.249.93',
                port: 9190,
                rconPassword: 'server1rankedonlinexx26',
                isActive: true,
                status: 'AVAILABLE',
            },
        });

        console.log('\n✅ Server added:', server.id);
        console.log('   Name:', server.name);
        console.log('   IP:', server.ipAddress + ':' + server.port);
        console.log('   RCON Port: 9190');
        console.log('   RCON Password:', server.rconPassword);
        console.log('   Status:', server.status);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

cleanAndAddServer();
