import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMatchFlow() {
    console.log('🧪 Testing Complete Match Flow\n');

    try {
        // 1. Get server
        const server = await prisma.gameServer.findUnique({
            where: { serverKey: 'ranked-server-k9cc0n0k4rc' },
        });

        if (!server) {
            console.error('❌ Server not found in database');
            process.exit(1);
        }

        console.log('✅ Server found:', server.name);
        console.log('   IP:', server.ipAddress + ':' + server.port);
        console.log('   RCON Password:', server.rconPassword ? '***' : 'NOT SET');

        // 2. Create test match
        console.log('\n📝 Creating test match...');
        const match = await prisma.match.create({
            data: {
                serverId: server.id,
                status: 'READY',
                selectedMap: 'c5m1_waterfront',
                mapName: 'c5m1_waterfront',
            },
        });

        console.log('✅ Match created:', match.id);

        // 3. Call start-match API
        console.log('\n🚀 Calling start-match API...');
        const response = await fetch('http://localhost:3000/api/server/start-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchId: match.id }),
        });

        const result = await response.json();
        console.log('📡 API Response:', result);

        if (result.success) {
            console.log('\n✅ SUCCESS! Check your L4D2 server - it should have changed to:', result.map);
            console.log('   The server should show a message in chat: "[Ranked] Match starting..."');
        } else {
            console.log('\n❌ API Error:', result.error);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testMatchFlow();
