
// Native fetch in Node 18+

async function testPluginConnection() {
    const API_URL = 'https://l4d2-ranked-production.up.railway.app/api/debug/matches';
    const SERVER_KEY = 'ranked-server-k9cc0n0k4rc'; // Key used in test-match.ts

    console.log(`🔌 Simulating Plugin Request to: ${API_URL}`);
    console.log(`🔑 Key: ${SERVER_KEY}`);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'User-Agent': 'SourceMod/L4D2-Ranked'
            },
            body: JSON.stringify({ server_key: SERVER_KEY })
        });

        console.log(`\n📡 Status Code: ${response.status}`);

        const text = await response.text();
        console.log('📦 Response Body:', text);

        try {
            const json = JSON.parse(text);
            if (json.success && json.data?.hasMatch) {
                console.log('\n✅ SUCCESS: API returned a match!');
                console.log('Match ID:', json.data.match.id);
            } else {
                console.log('\n⚠️  API returned valid JSON but NO match.');
            }
        } catch (e) {
            console.log('❌ Invalid JSON response');
        }

    } catch (error) {
        console.error('❌ Connection Failed:', error.message);
    }
}

testPluginConnection();
