
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkServerTags() {
    const KEY = 'ranked-server-k9cc0n0k4rc';
    console.log(`🔎 Looking for server with key: ${KEY}`);

    try {
        const server = await prisma.gameServer.findUnique({
            where: { serverKey: KEY },
            include: {
                currentMatches: {
                    where: { status: 'READY' }
                }
            }
        });

        if (!server) {
            console.log('❌ Server NOT found in database!');
        } else {
            console.log(`✅ Server Found: ${server.name} (ID: ${server.id})`);
            console.log(`   IP: ${server.ipAddress}:${server.port}`);
            console.log(`   Active Matches (READY): ${server.currentMatches.length}`);

            server.currentMatches.forEach(m => {
                console.log(`   - Match ID: ${m.id} | Status: ${m.status} | Map: ${m.mapName}`);
            });
        }

        // Also listed ALL READY matches just in case
        const allReady = await prisma.match.findMany({
            where: { status: 'READY' },
            select: { id: true, serverId: true, status: true }
        });

        console.log('\n--- ALL READY MATCHES IN DB ---');
        allReady.forEach(m => {
            console.log(`Match ${m.id} | ServerId: ${m.serverId}`);
        });

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkServerTags();
