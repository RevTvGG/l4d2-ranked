
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching server key...');
    const server = await prisma.gameServer.findFirst({
        where: {
            // Try to match partial IP if specific one fails, or just get the one from the match
            ipAddress: { contains: '50.20.249.93' }
        }
    });

    if (server) {
        console.log('FOUND KEY:', server.serverKey);
    } else {
        console.log('Server not found by IP. Listing all active servers:');
        const all = await prisma.gameServer.findMany();
        all.forEach(s => console.log(`[${s.ipAddress}:${s.port}] Key: ${s.serverKey}`));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
