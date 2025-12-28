const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupServer() {
    console.log('Setting up game server...');

    try {
        // Check if server already exists
        const existing = await prisma.gameServer.findFirst();

        if (existing) {
            console.log('✅ Server already exists:', existing.name);
            console.log('   ID:', existing.id);
            console.log('   IP:', existing.ipAddress + ':' + existing.port);
            return;
        }

        // Create new server
        const server = await prisma.gameServer.create({
            data: {
                name: 'BisectHosting Server',
                ipAddress: '50.20.249.93',
                port: 9190,
                rconPassword: 'server1rankedonlinexx26',
                serverKey: 'bisect-main-server',
                isActive: true,
                status: 'AVAILABLE'
            }
        });

        console.log('✅ Server created successfully!');
        console.log('   ID:', server.id);
        console.log('   Name:', server.name);
        console.log('   IP:', server.ipAddress + ':' + server.port);
        console.log('\n⚠️  IMPORTANT: Update the IP address and RCON password!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

setupServer();
