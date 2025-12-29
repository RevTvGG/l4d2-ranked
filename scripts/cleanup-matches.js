const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupOldMatches() {
    try {
        console.log('🧹 Cleaning up old matches...');

        // Delete all matches that are not completed or cancelled
        const result = await prisma.match.deleteMany({
            where: {
                status: {
                    in: ['READY', 'VETO', 'WAITING_FOR_PLAYERS', 'IN_PROGRESS']
                }
            }
        });

        console.log(`✅ Deleted ${result.count} old matches`);

        // Also reset all servers to AVAILABLE
        const serverUpdate = await prisma.gameServer.updateMany({
            where: {
                status: 'IN_USE'
            },
            data: {
                status: 'AVAILABLE'
            }
        });

        console.log(`✅ Reset ${serverUpdate.count} servers to AVAILABLE`);

        // Clean up queue entries
        const queueCleanup = await prisma.queueEntry.deleteMany({});
        console.log(`✅ Cleaned ${queueCleanup.count} queue entries`);

        console.log('✨ Cleanup complete!');
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupOldMatches();
