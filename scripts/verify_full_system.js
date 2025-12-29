// Native fetch is available in Node 18+


// CONFIGURATION
const API_URL = 'http://localhost:3000/api'; // Or your production URL
const SERVER_KEY = 'ranked-server-main'; // Must match your .env or DB
const MATCH_ID = 'test-match-verify-1'; // Simulating a match ID

async function verifySystem() {
    console.log('🚀 Starting Full System Verification...');

    // 1. Simulate Match End Request (Plugin -> Backend)
    // -------------------------------------------------
    console.log('\n📡 1. Simulating Plugin Request (match-end)...');

    const pluginPayload = {
        server_key: SERVER_KEY,
        match_id: MATCH_ID,
        winner: 'A', // Survivors won
        players: [
            {
                // Simulating YOU (Survivor, MVP)
                steam_id: '76561198084784262', // Your SteamID
                team: 1, // Plugin sends 1 for Survivors
                kills: 50,
                deaths: 2,
                damage: 1500,
                headshots: 20,
                mvp: 1 // Plugin sends 1 for MVP
            },
            {
                // Simulating a Bot/Opponent (Infected)
                steam_id: '76561198000000000', // Fake ID
                team: 2, // Plugin sends 2 for Infected
                kills: 5,
                deaths: 10,
                damage: 300,
                headshots: 0,
                mvp: 0
            }
        ]
    };

    console.log('   Payload:', JSON.stringify(pluginPayload, null, 2));

    try {
        // NOTE: This request might fail 404 if the match ID doesn't exist in DB.
        // But we want to see if it reaches the validation logic or "Match not found" error,
        // which confirms the endpoint is reachable and processing JSON.
        const response = await fetch(`${API_URL}/server/match-end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pluginPayload)
        });

        const data = await response.json();
        console.log(`   Response Status: ${response.status}`);
        console.log(`   Response Body:`, data);

        if (response.status === 404 && data.error === 'MATCH_NOT_FOUND') {
            console.log('   ✅ Backend reachable! (Got expected 404 for fake match ID)');
            console.log('   ✅ JSON Parsing works');
            console.log('   ✅ Server Key validation passed (otherwise would be 401)');
        } else if (response.status === 200) {
            console.log('   ✅ SUCCESS! Match processed.');
        } else {
            console.log('   ⚠️ Unexpected response. Check logs.');
        }

    } catch (error) {
        console.error('   ❌ Connection Failed:', error.message);
    }
}

verifySystem();
