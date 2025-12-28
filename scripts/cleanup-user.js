
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking Revv queue entry...');

    // Find Revv's user ID
    const revv = await prisma.user.findFirst({
        where: { name: 'Revv' }
    });

    if (!revv) {
        console.log('User Revv not found');
        return;
    }

    console.log('User ID:', revv.id);

    // Find queue entry
    const queueEntry = await prisma.queueEntry.findFirst({
        where: { userId: revv.id },
        include: { match: true }
    });

    if (queueEntry) {
        console.log('Queue Entry:', {
            id: queueEntry.id,
            status: queueEntry.status,
            matchId: queueEntry.matchId,
            matchStatus: queueEntry.match?.status
        });

        // Delete the queue entry to free the user
        await prisma.queueEntry.delete({
            where: { id: queueEntry.id }
        });
        console.log('Queue entry DELETED. User should be free now.');
    } else {
        console.log('No queue entry found for Revv');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
