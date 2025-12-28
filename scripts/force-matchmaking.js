const https = require('https');

console.log('🔄 Forcing matchmaking check...');
console.log('This will check the queue and create a match if 8+ players are waiting.\n');

const options = {
    hostname: 'www.l4d2ranked.online',
    port: 443,
    path: '/api/test/trigger-matchmaking',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (res.statusCode === 200) {
                console.log('✅ SUCCESS!');
                console.log(JSON.stringify(json, null, 2));
                console.log('\n📊 Check your browser - match should be created!');
            } else {
                console.log('❌ ERROR!');
                console.log(`Status: ${res.statusCode}`);
                console.log(JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.log('Response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
});

req.end();
