const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function completeCleanup() {
    console.log('🧹 COMPLETE DATABASE CLEANUP\n');
    console.log('This will remove ALL test data, bots, and reset everything.\n');

    try {
        // 1. Delete all fake bot users and their related data
        console.log('1️⃣ Deleting fake bots...');
        const deletedBots = await prisma.user.deleteMany({
            where: {
                steamId: {
                    startsWith: 'FAKE_BOT_'
                }
            }
        });
        console.log(`   ✅ Deleted ${deletedBots.count} fake bot users\n`);

        // 2. Delete all test users (Player 1, Player 2, etc.)
        console.log('2️⃣ Deleting test users...');
        const deletedTestUsers = await prisma.user.deleteMany({
            where: {
                OR: [
                    { name: { startsWith: 'Player ' } },
                    { name: { startsWith: 'Bot ' } },
                    { name: { startsWith: 'Test Player' } }
                ]
            }
        });
        console.log(`   ✅ Deleted ${deletedTestUsers.count} test users\n`);

        // 3. Delete ALL queue entries
        console.log('3️⃣ Clearing queue...');
        const deletedQueue = await prisma.queueEntry.deleteMany({});
        console.log(`   ✅ Deleted ${deletedQueue.count} queue entries\n`);

        // 4. Delete all test matches
        console.log('4️⃣ Deleting test matches...');
        const deletedMatches = await prisma.match.deleteMany({
            where: {
                status: {
                    in: ['WAITING_FOR_PLAYERS', 'READY', 'VETO']
                }
            }
        });
        console.log(`   ✅ Deleted ${deletedMatches.count} test matches\n`);

        // 5. Reset all servers to AVAILABLE
        console.log('5️⃣ Resetting servers...');
        const resetServers = await prisma.gameServer.updateMany({
            data: { status: 'AVAILABLE' }
        });
        console.log(`   ✅ Reset ${resetServers.count} servers to AVAILABLE\n`);

        // 6. Show remaining real users
        console.log('6️⃣ Remaining real users:');
        const realUsers = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                steamId: true,
                image: true
            }
        });

        if (realUsers.length === 0) {
            console.log('   ⚠️  No users found (all were test users)\n');
        } else {
            realUsers.forEach((user, i) => {
                console.log(`   ${i + 1}. ${user.name} (${user.steamId})`);
                console.log(`      Image: ${user.image ? '✅' : '❌ Missing'}`);
            });
        }

        console.log('\n✅ CLEANUP COMPLETE!');
        console.log('\n📊 Final State:');
        console.log(`   - Real users: ${realUsers.length}`);
        console.log(`   - Queue entries: 0`);
        console.log(`   - Active matches: 0`);
        console.log(`   - Servers: AVAILABLE`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

completeCleanup();
