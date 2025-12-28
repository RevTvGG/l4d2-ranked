// Script to reset matches and free up servers
// Run with: node scripts/reset-matches.js

const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();

    try {
        console.log('🔄 resetting state...');

        // 1. Reset all GameServers to AVAILABLE
        const updatedServers = await prisma.gameServer.updateMany({
            data: {
                status: 'AVAILABLE',
                isActive: true
            }
        });
        console.log(`✅ Reset ${updatedServers.count} servers to AVAILABLE`);

        // 2. Delete all matches (optional: or set to FINISHED)
        // Deleting matches will cascade delete matchPlayers, mapVotes, etc.
        const deletedMatches = await prisma.match.deleteMany({});
        console.log(`🗑️ Deleted ${deletedMatches.count} matches`);

        // 3. Clear Queue
        const deletedQueue = await prisma.queueEntry.deleteMany({});
        console.log(`🗑️ Cleared ${deletedQueue.count} queue entries`);

        // 4. Clean up fake bots if desired
        const deletedBots = await prisma.user.deleteMany({
            where: {
                steamId: { startsWith: 'FAKE_BOT_' }
            }
        });
        console.log(`🤖 Deleted ${deletedBots.count} fake bots`);

        console.log('\n✨ System ready for new tests!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
