const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMatchStatus() {
    try {
        // Find the most recent match
        const match = await prisma.match.findFirst({
            where: {
                status: {
                    in: ['READY', 'VETO', 'WAITING_FOR_PLAYERS']
                }
            },
            include: {
                players: {
                    include: {
                        user: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!match) {
            console.log('❌ No active match found');
            return;
        }

        console.log('✅ Match found!');
        console.log(`   ID: ${match.id}`);
        console.log(`   Status: ${match.status}`);
        console.log(`   Map: ${match.selectedMap || 'Not selected'}`);
        console.log(`   Players: ${match.players.length}`);
        console.log('\nPlayers:');
        match.players.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.user.name} (${p.team}) - Ready: ${p.isReady}`);
        });

        console.log(`\n📍 Match URL: https://www.l4d2ranked.online/match/${match.id}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkMatchStatus();
