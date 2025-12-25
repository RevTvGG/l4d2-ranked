import { prisma } from '@/lib/prisma';

async function setupGameServer() {
    console.log('🎮 Setting up game server in database...\n');

    try {
        // Check if server already exists
        const existing = await prisma.gameServer.findFirst({
            where: { ipAddress: '50.20.249.93' },
        });

        if (existing) {
            console.log('⚠️  Server already exists, updating...');
            const updated = await prisma.gameServer.update({
                where: { id: existing.id },
                data: {
                    name: 'L4D2 Ranked Server #1',
                    port: 9190,
                    rconPassword: 'server1rankedonlinexx26',
                    rconPort: 9190,
                    serverKey: 'ranked-server-k9cc0n0k4rc',
                    isActive: true,
                    status: 'AVAILABLE',
                },
            });
            console.log('✅ Server updated:', updated.id);
        } else {
            const server = await prisma.gameServer.create({
                data: {
                    name: 'L4D2 Ranked Server #1',
                    ipAddress: '50.20.249.93',
                    port: 9190,
                    rconPassword: 'server1rankedonlinexx26',
                    rconPort: 9190,
                    serverKey: 'ranked-server-k9cc0n0k4rc',
                    isActive: true,
                    status: 'AVAILABLE',
                },
            });
            console.log('✅ Server created:', server.id);
        }

        console.log('\n✅ Setup complete!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

setupGameServer();
