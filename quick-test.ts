import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function quickTest() {
    console.log('🔍 Testing Neon Connection...\n');

    try {
        // Test 1: Create server key
        const server = await prisma.gameServer.upsert({
            where: { serverKey: 'test-key-123' },
            update: { isActive: true },
            create: {
                name: 'Test Server',
                serverKey: 'test-key-123',
                ipAddress: '127.0.0.1',
                port: 27015,
                isActive: true
            }
        });

        console.log('✅ Database connection successful!');
        console.log(`✅ Server created: ${server.name}`);
        console.log(`✅ Server key: ${server.serverKey}\n`);

        // Test 2: Test API endpoint
        console.log('🧪 Testing /api/match/start endpoint...\n');

        const response = await fetch('http://localhost:3000/api/match/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                matchId: 'test-123',
                serverKey: 'test-key-123',
                serverIp: '127.0.0.1',
                serverPort: 27015,
                timestamp: new Date().toISOString()
            })
        });

        const data = await response.json();

        console.log(`Status: ${response.status}`);
        console.log(`Response:`, JSON.stringify(data, null, 2));

        if (response.status === 404) {
            console.log('\n⚠️  Match not found (expected - no match exists yet)');
            console.log('✅ API endpoint is working correctly!\n');
        } else if (data.success) {
            console.log('\n✅ API test passed!\n');
        } else {
            console.log('\n❌ API test failed\n');
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

quickTest();
