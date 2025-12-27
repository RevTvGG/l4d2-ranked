/**
 * Debug script to check what plugins are loaded on the server
 * This helps us understand the exact format of the plugin list output
 */

const RconService = require('../lib/rcon.ts').RconService;

async function checkPlugins() {
    const rcon = new RconService();

    try {
        console.log('🔍 Connecting to RCON...');
        await rcon.connect();

        console.log('\n📋 Executing: sm plugins list\n');
        const result = await rcon.execute('sm plugins list');

        console.log('Success:', result.success);
        console.log('\n--- FULL OUTPUT ---');
        console.log(result.output);
        console.log('--- END OUTPUT ---\n');

        // Check for our plugin
        const patterns = [
            'l4d2_team_assignment',
            'L4D2 Auto Team Assignment',
            'Team Assignment',
            'team_assignment'
        ];

        console.log('🔍 Checking for plugin patterns:');
        patterns.forEach(pattern => {
            const found = result.output.includes(pattern);
            console.log(`  ${found ? '✅' : '❌'} "${pattern}"`);
        });

        await rcon.disconnect();

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkPlugins();
