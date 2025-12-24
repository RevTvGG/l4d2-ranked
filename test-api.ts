import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestServerKey() {
    console.log('🔑 Creating test server key...\n');

    const testKey = 'test-server-key-12345';

    // Create or update test server
    const server = await prisma.gameServer.upsert({
        where: { serverKey: testKey },
        update: {
            isActive: true
        },
        create: {
            name: 'Test Server',
            serverKey: testKey,
            ipAddress: '127.0.0.1',
            port: 27015,
            isActive: true
        }
    });

    console.log('✅ Server created:');
    console.log(`   Name: ${server.name}`);
    console.log(`   Key: ${server.serverKey}`);
    console.log(`   IP: ${server.ipAddress}:${server.port}\n`);

    return server.serverKey;
}

async function testAPI() {
    const baseUrl = 'http://localhost:3000/api/match';
    const serverKey = await createTestServerKey();

    console.log('🧪 Starting API Tests...\n');
    console.log('='.repeat(50) + '\n');

    // Test 1: Start Match
    console.log('📍 Test 1: POST /api/match/start');
    try {
        const startResponse = await fetch(`${baseUrl}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                matchId: 'test-match-123',
                serverKey,
                serverIp: '127.0.0.1',
                serverPort: 27015,
                timestamp: new Date().toISOString()
            })
        });

        const startData = await startResponse.json();
        console.log(`   Status: ${startResponse.status}`);
        console.log(`   Response:`, JSON.stringify(startData, null, 2));
        console.log('');
    } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Test 2: Report Round
    console.log('📍 Test 2: POST /api/match/round');
    try {
        const roundResponse = await fetch(`${baseUrl}/round`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                matchId: 'test-match-123',
                serverKey,
                roundNumber: 1,
                team: 'A',
                score: 850,
                survivors: [
                    {
                        steamId: '76561198012345678',
                        survived: true,
                        damage: 5000,
                        kills: 120,
                        headshots: 45,
                        friendlyFire: 0
                    }
                ],
                infected: [
                    {
                        steamId: '76561198087654321',
                        damage: 3000,
                        kills: 2,
                        smokerPulls: 5,
                        hunterPounces: 8
                    }
                ]
            })
        });

        const roundData = await roundResponse.json();
        console.log(`   Status: ${roundResponse.status}`);
        console.log(`   Response:`, JSON.stringify(roundData, null, 2));
        console.log('');
    } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Test 3: Complete Match
    console.log('📍 Test 3: POST /api/match/complete');
    try {
        const completeResponse = await fetch(`${baseUrl}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                matchId: 'test-match-123',
                serverKey,
                winnerTeam: 'A',
                finalScores: {
                    teamA: 1700,
                    teamB: 1500
                },
                mvp: '76561198012345678'
            })
        });

        const completeData = await completeResponse.json();
        console.log(`   Status: ${completeResponse.status}`);
        console.log(`   Response:`, JSON.stringify(completeData, null, 2));
        console.log('');
    } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Test 4: Player Disconnect
    console.log('📍 Test 4: POST /api/match/player-disconnect');
    try {
        const disconnectResponse = await fetch(`${baseUrl}/player-disconnect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                matchId: 'test-match-456',
                serverKey,
                steamId: '76561198012345678',
                reason: 'TIMEOUT'
            })
        });

        const disconnectData = await disconnectResponse.json();
        console.log(`   Status: ${disconnectResponse.status}`);
        console.log(`   Response:`, JSON.stringify(disconnectData, null, 2));
        console.log('');
    } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Test 5: Cancel Match
    console.log('📍 Test 5: POST /api/match/cancel');
    try {
        const cancelResponse = await fetch(`${baseUrl}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                matchId: 'test-match-789',
                serverKey,
                reason: 'SERVER_CRASH'
            })
        });

        const cancelData = await cancelResponse.json();
        console.log(`   Status: ${cancelResponse.status}`);
        console.log(`   Response:`, JSON.stringify(cancelData, null, 2));
        console.log('');
    } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }

    console.log('='.repeat(50));
    console.log('✅ API Tests Complete!\n');

    await prisma.$disconnect();
}

testAPI().catch(console.error);
