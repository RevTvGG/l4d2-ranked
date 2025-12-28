
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking user stats...');
    const users = await prisma.user.findMany({
        select: {
            name: true,
            steamId: true,
            wins: true,
            losses: true,
            rating: true,
            totalHours: true
        }
    });
    console.log(users);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
