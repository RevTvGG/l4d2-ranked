
const SERVER_KEY = 'ranked-server-k9cc0n0k4rc';
// URL for local testing. In production, switch to https://...
const API_URL = 'https://l4d2-ranked-production.up.railway.app/api/server/check-match';

async function verifyApi() {
    console.log('🧪 Verifying API Re-implementation...');
    console.log(`📡 URL: ${API_URL}`);
    console.log(`🔑 Key: ${SERVER_KEY}\n`);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // CRITICAL
                'User-Agent': 'SourceMod/L4D2-Ranked'
            },
            body: JSON.stringify({
                server_key: SERVER_KEY
            })
        });

        const status = response.status;
        console.log(`Status Code: ${status}`);

        const text = await response.text();
        console.log(`Body Preview: ${text.substring(0, 200)}...`);

        if (status !== 200) {
            console.error('❌ FAILED: Unexpected status code');
            return;
        }

        try {
            const json = JSON.parse(text);
            if (json.success === true) {
                console.log('✅ SUCCESS: API returned valid structured response');
                if (json.data.match_id) {
                    console.log('🎉 MATCH FOUND:', json.data.match_id);
                    console.log('   Map:', json.data.map);
                    console.log('   Teams:', Object.keys(json.data.teams));
                } else {
                    console.log('⚠️  Valid JSON, but NO MATCH found (this is OK if queue is empty)');
                }
            } else {
                console.error('❌ FAILED: API returned success=false');
            }
        } catch {
            console.error('❌ FAILED: Response is not JSON');
        }

    } catch (e) {
        console.error('❌ NETWORK ERROR:', e.message);
    }
}

verifyApi();
