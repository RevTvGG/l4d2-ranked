
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Deleting all FAKE_BOT users...');

    // First delete related records
    const deletedQueueEntries = await prisma.queueEntry.deleteMany({
        where: {
            user: { steamId: { startsWith: 'FAKE_BOT_' } }
        }
    });
    console.log('Deleted queue entries:', deletedQueueEntries.count);

    const deletedMatchPlayers = await prisma.matchPlayer.deleteMany({
        where: {
            user: { steamId: { startsWith: 'FAKE_BOT_' } }
        }
    });
    console.log('Deleted match players:', deletedMatchPlayers.count);

    const deletedMapVotes = await prisma.mapVote.deleteMany({
        where: {
            user: { steamId: { startsWith: 'FAKE_BOT_' } }
        }
    });
    console.log('Deleted map votes:', deletedMapVotes.count);

    // Now delete the bot users
    const deletedUsers = await prisma.user.deleteMany({
        where: { steamId: { startsWith: 'FAKE_BOT_' } }
    });
    console.log('Deleted bot users:', deletedUsers.count);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
