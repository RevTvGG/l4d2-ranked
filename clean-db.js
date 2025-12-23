const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning database...');
    await prisma.account.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('Database cleaned.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
