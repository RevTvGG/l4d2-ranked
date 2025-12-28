// Script to clean up test players from the database
// Run with: node scripts/cleanup-test-players.js

const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();

    try {
        console.log('🧹 Cleaning up test players...\n');

        // Find test players (names containing "Test" or "Bot" or fake SteamIDs)
        const testUsers = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: 'Test', mode: 'insensitive' } },
                    { name: { contains: 'Bot', mode: 'insensitive' } },
                    { steamId: { startsWith: 'BOT_' } },
                    { steamId: { startsWith: 'test_' } },
                ]
            },
            select: { id: true, name: true, steamId: true }
        });

        console.log(`Found ${testUsers.length} test users:`);
        testUsers.forEach(u => console.log(`  - ${u.name} (${u.steamId})`));

        if (testUsers.length === 0) {
            console.log('\n✅ No test users found. Database is clean!');
            return;
        }

        const userIds = testUsers.map(u => u.id);

        // Delete related records first (due to foreign keys)
        console.log('\n🗑️ Deleting related records...');

        // Delete queue entries
        const queueDeleted = await prisma.queueEntry.deleteMany({
            where: { userId: { in: userIds } }
        });
        console.log(`  - Deleted ${queueDeleted.count} queue entries`);

        // Delete match players
        const matchPlayersDeleted = await prisma.matchPlayer.deleteMany({
            where: { userId: { in: userIds } }
        });
        console.log(`  - Deleted ${matchPlayersDeleted.count} match player records`);

        // Delete map votes
        const mapVotesDeleted = await prisma.mapVote.deleteMany({
            where: { userId: { in: userIds } }
        });
        console.log(`  - Deleted ${mapVotesDeleted.count} map votes`);

        // Delete bans
        const bansDeleted = await prisma.ban.deleteMany({
            where: { userId: { in: userIds } }
        });
        console.log(`  - Deleted ${bansDeleted.count} bans`);

        // Delete messages
        const messagesDeleted = await prisma.message.deleteMany({
            where: { userId: { in: userIds } }
        });
        console.log(`  - Deleted ${messagesDeleted.count} messages`);

        // Finally delete users
        const usersDeleted = await prisma.user.deleteMany({
            where: { id: { in: userIds } }
        });
        console.log(`  - Deleted ${usersDeleted.count} test users`);

        console.log('\n✅ Cleanup complete!');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
