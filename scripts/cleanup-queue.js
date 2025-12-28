const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupQueue() {
    console.log('🧹 Cleaning up queue and old matches...\n');

    try {
        // 1. Delete all fake bot queue entries
        const deletedBots = await prisma.queueEntry.deleteMany({
            where: {
                user: {
                    steamId: {
                        startsWith: 'FAKE_BOT_'
                    }
                }
            }
        });
        console.log(`✅ Deleted ${deletedBots.count} bot queue entries`);

        // 2. Delete old test matches
        const deletedMatches = await prisma.match.deleteMany({
            where: {
                status: {
                    in: ['WAITING_FOR_PLAYERS', 'READY', 'VETO']
                }
            }
        });
        console.log(`✅ Deleted ${deletedMatches.count} old matches`);

        // 3. Reset server status
        const updatedServer = await prisma.gameServer.updateMany({
            where: { status: 'IN_USE' },
            data: { status: 'AVAILABLE' }
        });
        console.log(`✅ Reset ${updatedServer.count} servers to AVAILABLE`);

        // 4. Check remaining queue
        const remaining = await prisma.queueEntry.findMany({
            where: { status: 'WAITING' },
            include: { user: true }
        });

        console.log(`\n📊 Remaining players in queue: ${remaining.length}`);
        remaining.forEach(entry => {
            console.log(`  - ${entry.user.name} (${entry.user.steamId})`);
        });

        console.log('\n✅ Cleanup complete!');
        console.log('\n💡 Now you can:');
        console.log('   1. Both join queue normally');
        console.log('   2. Click "Test Mode" to add 7 bots');
        console.log('   3. Match will create automatically');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupQueue();
