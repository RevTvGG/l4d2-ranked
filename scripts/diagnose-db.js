const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnoseDatabase() {
    console.log('🔍 Diagnosing database state...\n');

    try {
        // Check if users exist
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                steamId: true,
                isAdmin: true
            }
        });

        console.log(`📊 Total users: ${users.length}\n`);

        if (users.length === 0) {
            console.log('❌ No users found in database!');
            console.log('This might mean the migration wiped the data.\n');
        } else {
            console.log('Users found:');
            users.forEach((user, i) => {
                console.log(`  ${i + 1}. ${user.name || 'Unknown'}`);
                console.log(`     Steam ID: ${user.steamId || 'None'}`);
                console.log(`     Admin: ${user.isAdmin ? 'YES' : 'NO'}`);
                console.log(`     ID: ${user.id}\n`);
            });
        }

        // Check schema version
        console.log('🔧 Checking if new schema fields exist...');

        // Try to query with new fields
        try {
            const testUser = await prisma.user.findFirst({
                select: {
                    isAdmin: true
                }
            });
            console.log('✅ isAdmin field exists\n');
        } catch (error) {
            console.log('❌ isAdmin field does NOT exist');
            console.log('Migration may not have applied correctly\n');
        }

        // Check bans
        const bans = await prisma.ban.findMany({
            select: {
                id: true,
                type: true,
                duration: true
            }
        });
        console.log(`📊 Total bans: ${bans.length}`);

    } catch (error) {
        console.error('❌ Error:', error);
        console.log('\nThis error suggests the schema migration has issues.');
    } finally {
        await prisma.$disconnect();
    }
}

diagnoseDatabase();
