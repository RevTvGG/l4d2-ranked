const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateServer() {
    try {
        // Find the server
        const server = await prisma.gameServer.findFirst();

        if (!server) {
            console.log('❌ No server found');
            return;
        }

        console.log('Current server:', server.ipAddress + ':' + server.port);

        // Update with correct IP and port
        const updated = await prisma.gameServer.update({
            where: { id: server.id },
            data: {
                ipAddress: '50.20.249.93',
                port: 9190
            }
        });

        console.log('✅ Server updated!');
        console.log('   New IP:', updated.ipAddress + ':' + updated.port);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateServer();
