require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const title = "Beta Notice";
    const content = `L4D2 Ranked is currently in BETA. You may experience bugs, errors, or unexpected behavior.

Known Limitations:
- Matchmaking may occasionally fail to connect
- Stats may not update immediately
- Server connection issues may occur

Please report issues to our Discord.

IMPORTANT: Before playing, you MUST read our FAQ & Ban Policies.`;

    // Check if already exists
    const existing = await prisma.announcement.findFirst({
        where: { title: title }
    });

    if (existing) {
        console.log("Beta Notice already exists.");
    } else {
        await prisma.announcement.create({
            data: {
                title: title,
                content: content,
                type: "WARNING",
                location: "GLOBAL",
                active: true
            }
        });
        console.log("Beta Notice created.");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
