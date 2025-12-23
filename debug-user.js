const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- USER ERROR DETAILS ---');
    const users = await prisma.user.findMany({
        include: { accounts: true },
    });
    users.forEach(u => {
        console.log(`User ID: ${u.id}`);
        console.log(`Email: ${u.email} (Type: ${typeof u.email})`);
        console.log(`Name: ${u.name}`);
        console.log(`Accounts: ${u.accounts.length}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
