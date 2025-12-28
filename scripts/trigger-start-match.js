const https = require('https');

async function startMatch() {
    const matchId = 'cmjq0cjmh0001qm96gxs236uc';

    console.log(`Calling /api/server/start-match for match: ${matchId}`);
    console.log('This will:');
    console.log('  1. Change server map to Dark Carnival');
    console.log('  2. Configure plugin API URL');
    console.log('  3. Set match ID on server');
    console.log('  4. Configure player whitelist');
    console.log('  5. Update server status to IN_USE');
    console.log('\nPlease wait ~30 seconds...\n');

    const data = JSON.stringify({ matchId });

    const options = {
        hostname: 'www.l4d2ranked.online',
        port: 443,
        path: '/api/server/start-match',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
            responseData += chunk;
        });

        res.on('end', () => {
            try {
                const json = JSON.parse(responseData);
                if (res.statusCode === 200) {
                    console.log('✅ SUCCESS!');
                    console.log(JSON.stringify(json, null, 2));
                } else {
                    console.log('❌ ERROR!');
                    console.log(`Status: ${res.statusCode}`);
                    console.log(JSON.stringify(json, null, 2));
                }
            } catch (e) {
                console.log('Response:', responseData);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Request failed:', error.message);
    });

    req.write(data);
    req.end();
}

startMatch();
