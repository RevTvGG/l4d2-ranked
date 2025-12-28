
const fetch = require('node-fetch'); // Needs node-fetch or native fetch in Node 18+

const API_URL = 'http://localhost:3000/api/server/match-end';
const MATCH_ID = process.argv[2]; // Pass match ID as arg
const SERVER_KEY = 'dev_server_123'; // Hardcoded for dev env

if (!MATCH_ID) {
    console.error('Please provide a Match ID');
    process.exit(1);
}

const mockStats = {
    server_key: SERVER_KEY,
    match_id: MATCH_ID,
    winner: 'A',
    players: [
        // Real User (Revv) -> Assume he is Team A and MVP
        // NOTE: You might need to check your DB for your specific SteamID if this fails
        // From context, user name is Revv. Using placeholder or trying to fetch. 
        // Let's assume the user will input it or we just use a known one. 
        // For now, I'll update it to match the logic:
        { steam_id: '76561198020309995', team: 1, kills: 45, deaths: 2, headshots: 15, damage: 3000, mvp: 1 },
        // Bots...
    ]
};

async function endMatch() {
    console.log(`Ending match ${MATCH_ID}...`);
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mockStats)
        });
        const data = await res.json();
        console.log('Result:', data);
    } catch (e) {
        console.error('Error:', e);
    }
}

endMatch();
