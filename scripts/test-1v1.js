const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuration
const SERVER_ID = 'cmjlw5p1m0000qxrzhg4lqm7k'; // Current server ID
const MAP_NAME = 'Dark Carnival';

async function create1v1Match(player1SteamId, player2SteamId) {
    if (!player1SteamId || !player2SteamId) {
        console.error('Usage: node scripts/test-1v1.js <STEAM_ID_1> <STEAM_ID_2>');
        console.error('Example: node scripts/test-1v1.js STEAM_1:0:12345 STEAM_1:1:67890');
        process.exit(1);
    }

    console.log(`Creating 1v1 match for ${player1SteamId} vs ${player2SteamId}...`);

    try {
        // 1. Ensure users exist
        const p1 = await ensureUser(player1SteamId, 'Player 1');
        const p2 = await ensureUser(player2SteamId, 'Player 2');

        // 2. Create match
        const match = await prisma.match.create({
            data: {
                status: 'WAITING_FOR_PLAYERS',
                selectedMap: MAP_NAME,
                serverId: SERVER_ID,

                // Add players
                players: {
                    create: [
                        { userId: p1.id, team: 'TEAM_A', eloAtStart: p1.rating },
                        { userId: p2.id, team: 'TEAM_B', eloAtStart: p2.rating }
                    ]
                }
            },
            include: {
                players: { include: { user: true } },
                server: true
            }
        });

        console.log('\n✅ Match Created Successfully!');
        console.log(`Match ID: ${match.id}`);
        console.log(`URL: https://www.l4d2ranked.online/match/${match.id}`);
        console.log('\n--- Next Steps ---');
        console.log('1. Open the URL above');
        console.log('2. Click "Connect to Server"');
        console.log('3. In game console: type "!match" and select ZoneMod 2.9');
        console.log('4. Type "!ready"');
        console.log('5. Verify that match goes LIVE and plugin reports to API');

        // Also simulate the API call that usually happens in start-match
        // This sets the match ID on the server via RCON
        console.log('\nAttempting to set Match ID on server via API...');

        try {
            // We can't call the API directly easily from script without auth
            // But we can print the RCON command you can run manually if needed
            const apiUrl = 'https://www.l4d2ranked.online'; // Production URL
            console.log(`\nIf the API doesn't set it automatically, run this RCON command:`);
            console.log(`sm_set_match_id ${match.id} ${apiUrl}/api`);
        } catch (e) {
            console.warn('Failed to auto-configure server:', e.message);
        }

    } catch (error) {
        console.error('Error creating match:', error);
    } finally {
        await prisma.$disconnect();
    }
}

async function ensureUser(steamId, nameDefault) {
    let user = await prisma.user.findUnique({
        where: { steamId }
    });

    if (!user) {
        console.log(`Creating user for ${steamId}...`);
        user = await prisma.user.create({
            data: {
                steamId,
                name: nameDefault,
                email: `${steamId}@test.com`,
                image: 'https://avatars.akamai.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'
            }
        });
    }

    return user;
}

// Get args
const args = process.argv.slice(2);
create1v1Match(args[0], args[1]);
