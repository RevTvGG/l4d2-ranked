import { createRconService } from './lib/rcon';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRconDirect() {
    console.log('🧪 Testing RCON Integration (Direct)\n');

    try {
        // 1. Get server from database
        const server = await prisma.gameServer.findUnique({
            where: { serverKey: 'ranked-server-k9cc0n0k4rc' },
        });

        if (!server || !server.rconPassword) {
            console.error('❌ Server not found or RCON password not set');
            process.exit(1);
        }

        console.log('✅ Server found:', server.name);
        console.log('   IP:', server.ipAddress + ':' + server.port);

        // 2. Test RCON connection
        console.log('\n📡 Connecting to server via RCON...');
        const rcon = createRconService(
            server.ipAddress,
            server.port,
            server.rconPassword
        );

        await rcon.connect();
        console.log('✅ RCON connected!');

        // 3. Send test message
        console.log('\n💬 Sending test message...');
        await rcon.say('[RCON Test] Integration working!');
        console.log('✅ Message sent');

        // 4. Change map
        console.log('\n🗺️  Changing map to c5m1_waterfront...');
        await rcon.changeMap('c5m1_waterfront');
        console.log('✅ Map change command sent');

        await rcon.disconnect();

        console.log('\n✅ SUCCESS! Check your L4D2 server:');
        console.log('   - You should see the test message in chat');
        console.log('   - The map should be changing to c5m1_waterfront');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testRconDirect();
