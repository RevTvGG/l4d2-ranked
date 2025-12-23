const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- USERS ---');
    const users = await prisma.user.findMany({ include: { accounts: true } });
    console.dir(users, { depth: null });

    console.log('--- ACCOUNTS ---');
    const accounts = await prisma.account.findMany();
    console.dir(accounts, { depth: null });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
