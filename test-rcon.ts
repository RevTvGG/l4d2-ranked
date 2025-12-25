import { createRconService } from '@/lib/rcon';

async function testRconConnection() {
    console.log('🧪 Testing RCON Connection...\n');

    const config = {
        host: '50.20.249.93',
        port: 9190,
        password: 'server1rankedonlinexx26',
    };

    console.log(`📡 Connecting to ${config.host}:${config.port}...`);

    const rcon = createRconService(config.host, config.port, config.password);

    try {
        // Test connection
        await rcon.connect();
        console.log('✅ Connection successful!\n');

        // Test basic command
        console.log('📋 Testing "status" command...');
        const statusResponse = await rcon.execute('status');
        console.log('Response:', statusResponse.substring(0, 200), '...\n');

        // Test say command
        console.log('💬 Testing "say" command...');
        await rcon.say('[RCON Test] Hello from web platform!');
        console.log('✅ Say command sent\n');

        // Disconnect
        await rcon.disconnect();
        console.log('✅ Test completed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error);
        await rcon.disconnect();
        process.exit(1);
    }
}

testRconConnection();
