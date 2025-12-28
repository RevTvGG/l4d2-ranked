
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MATCH_ID = process.argv[2];

async function main() {
    if (!MATCH_ID) throw new Error("Match ID required");

    console.log(`Resetting match ${MATCH_ID}...`);
    await prisma.match.update({
        where: { id: MATCH_ID },
        data: { status: 'IN_PROGRESS', completedAt: null, winnerTeam: null }
    });
    console.log("Match reset to IN_PROGRESS");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
