
// Native fetch is available in recent Node.js versions
// match-end script

const API_URL = 'https://www.l4d2ranked.online/api/server/match-end';
const MATCH_ID = process.argv[2]; // Pass match ID as arg
const SERVER_KEY = 'ranked-server-main'; // Key from DB

if (!MATCH_ID) {
    console.error('Please provide a Match ID');
    process.exit(1);
}

const mockStats = {
    server_key: SERVER_KEY,
    match_id: MATCH_ID,
    winner: 'A',
    players: [
        // Real User (Revv) -> CORRECT ID found in DB
        { steam_id: '76561198113376372', team: 1, kills: 45, deaths: 2, headshots: 15, damage: 3000, mvp: 1 },
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
        const text = await res.text();
        try {
            const data = JSON.parse(text);
            console.log('Result:', data);
        } catch (e) {
            console.error('Failed to parse JSON. Raw response:', text.substring(0, 200));
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

endMatch();
