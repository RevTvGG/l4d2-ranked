const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setOwner() {
    // Set the owner role for user with SteamID 76561198113376372 (Revv)
    const result = await prisma.user.update({
        where: { steamId: '76561198113376372' },
        data: { role: 'OWNER' }
    });

    console.log('Updated user:', result.name, '-> Role:', result.role);
    await prisma.$disconnect();
}

setOwner().catch(console.error);
