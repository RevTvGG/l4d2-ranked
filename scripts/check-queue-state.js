const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkQueueState() {
    console.log('🔍 Checking queue state...\n');

    try {
        // Get all queue entries
        const queueEntries = await prisma.queueEntry.findMany({
            where: { status: 'WAITING' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        steamId: true
                    }
                }
            }
        });

        console.log(`📊 Total players in queue: ${queueEntries.length}\n`);

        if (queueEntries.length === 0) {
            console.log('❌ No players in queue!');
            return;
        }

        console.log('Players:');
        queueEntries.forEach((entry, i) => {
            console.log(`  ${i + 1}. ${entry.user.name} (${entry.user.steamId})`);
        });

        console.log('\n---\n');

        // Check if there are any active matches
        const activeMatches = await prisma.match.findMany({
            where: {
                status: {
                    in: ['READY', 'VETO', 'WAITING_FOR_PLAYERS', 'IN_PROGRESS']
                }
            }
        });

        console.log(`🎮 Active matches: ${activeMatches.length}`);
        if (activeMatches.length > 0) {
            activeMatches.forEach(match => {
                console.log(`  - Match ${match.id}: ${match.status}`);
            });
        }

        console.log('\n---\n');

        // Check server availability
        const servers = await prisma.gameServer.findMany();
        console.log(`🖥️  Total servers: ${servers.length}`);
        servers.forEach(server => {
            console.log(`  - ${server.name}: ${server.status} (${server.isActive ? 'active' : 'inactive'})`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkQueueState();
