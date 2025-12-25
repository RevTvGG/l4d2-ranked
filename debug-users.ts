
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, steamId: true }
        });

        console.log('--- ALL USERS ---');
        users.forEach(u => console.log(`${u.name} (Steam: ${u.steamId}) - ID: ${u.id}`));

        const qEntries = await prisma.queueEntry.findMany({
            include: { match: true }
        });
        console.log('\n--- ACTIVE QUEUE ENTRIES ---');
        qEntries.forEach(q => {
            console.log(`User: ${q.userId} | Status: ${q.status}`);
            console.log(`Match ID: ${q.matchId} | Match Status: ${q.match?.status}`);
            console.log(`Expires: ${q.expiresAt}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
