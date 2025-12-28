const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * PRODUCTION DATABASE CLEANUP SCRIPT
 * 
 * This script removes ALL test data from the database.
 * Run this BEFORE launching with real users.
 * 
 * WARNING: This will delete:
 * - All matches
 * - All match players
 * - All queue entries
 * - All test users (keeps real Steam users)
 * - All map votes
 * - All rounds
 * - All bans
 * 
 * Usage: node scripts/cleanup-production.js
 */

async function cleanupProduction() {
    console.log('🧹 Starting production database cleanup...\n');

    try {
        // 1. Delete all rounds (must be first due to foreign keys)
        const rounds = await prisma.round.deleteMany({});
        console.log(`✅ Deleted ${rounds.count} rounds`);

        // 2. Delete all player round stats
        const playerRoundStats = await prisma.playerRoundStats.deleteMany({});
        console.log(`✅ Deleted ${playerRoundStats.count} player round stats`);

        // 3. Delete all map votes
        const mapVotes = await prisma.mapVote.deleteMany({});
        console.log(`✅ Deleted ${mapVotes.count} map votes`);

        // 4. Delete all match players
        const matchPlayers = await prisma.matchPlayer.deleteMany({});
        console.log(`✅ Deleted ${matchPlayers.count} match players`);

        // 5. Delete all queue entries
        const queueEntries = await prisma.queueEntry.deleteMany({});
        console.log(`✅ Deleted ${queueEntries.count} queue entries`);

        // 6. Delete all matches
        const matches = await prisma.match.deleteMany({});
        console.log(`✅ Deleted ${matches.count} matches`);

        // 7. Delete all bans
        const bans = await prisma.ban.deleteMany({});
        console.log(`✅ Deleted ${bans.count} bans`);

        // 8. Delete test users (users without real Steam accounts)
        const testUsers = await prisma.user.deleteMany({
            where: {
                OR: [
                    { email: { contains: '@test.com' } },
                    { name: { contains: 'Test Player' } },
                    { name: { contains: 'Player 1' } },
                    { name: { contains: 'Player 2' } },
                ]
            }
        });
        console.log(`✅ Deleted ${testUsers.count} test users`);

        // 9. Reset ELO for all remaining users to 1000
        const resetUsers = await prisma.user.updateMany({
            data: {
                rating: 1000,
                wins: 0,
                losses: 0,
                winRate: 0.0,
                banCount: 0
            }
        });
        console.log(`✅ Reset ${resetUsers.count} user stats to default`);

        // 10. Get final counts
        const finalCounts = {
            users: await prisma.user.count(),
            servers: await prisma.gameServer.count(),
            teams: await prisma.team.count(),
        };

        console.log('\n📊 Final Database State:');
        console.log(`   Users: ${finalCounts.users}`);
        console.log(`   Servers: ${finalCounts.servers}`);
        console.log(`   Teams: ${finalCounts.teams}`);
        console.log(`   Matches: 0`);
        console.log(`   Queue Entries: 0`);

        console.log('\n✅ Production database is now clean and ready for real users!');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will delete ALL test data from the database!');
console.log('⚠️  Make sure you are running this on the PRODUCTION database.');
console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...\n');

setTimeout(() => {
    cleanupProduction();
}, 5000);
