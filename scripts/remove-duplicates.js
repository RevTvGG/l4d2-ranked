const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeDuplicates() {
    console.log('🧹 Removing duplicate queue entries...\n');

    try {
        // Get all users with queue entries
        const allEntries = await prisma.queueEntry.findMany({
            where: { status: 'WAITING' },
            include: { user: true },
            orderBy: { createdAt: 'asc' } // Keep oldest
        });

        const seenUsers = new Set();
        const toDelete = [];

        for (const entry of allEntries) {
            if (seenUsers.has(entry.userId)) {
                toDelete.push(entry.id);
            } else {
                seenUsers.add(entry.userId);
            }
        }

        if (toDelete.length > 0) {
            await prisma.queueEntry.deleteMany({
                where: { id: { in: toDelete } }
            });
            console.log(`✅ Deleted ${toDelete.length} duplicate entries`);
        } else {
            console.log('✅ No duplicates found');
        }

        // Show final state
        const remaining = await prisma.queueEntry.findMany({
            where: { status: 'WAITING' },
            include: { user: true }
        });

        console.log(`\n📊 Final queue state: ${remaining.length} players`);
        remaining.forEach((entry, i) => {
            console.log(`  ${i + 1}. ${entry.user.name} (${entry.user.steamId})`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

removeDuplicates();
