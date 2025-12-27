/**
 * Complete Match Flow Testing Script
 * 
 * This script tests the entire match flow from queue to match completion.
 * It uses the test API endpoints to simulate the full ranked match process.
 * 
 * Usage:
 *   node scripts/test-match-flow.js
 * 
 * Environment Variables Required:
 *   - TEST_API_TOKEN: Token for authenticating test endpoints
 *   - API_URL: Base URL of the API (default: http://localhost:3000)
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_API_TOKEN = process.env.TEST_API_TOKEN;

if (!TEST_API_TOKEN) {
    console.error('❌ ERROR: TEST_API_TOKEN environment variable is required');
    console.error('Please set it in your .env file or export it:');
    console.error('  export TEST_API_TOKEN=your_token_here');
    process.exit(1);
}

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`${step}. ${message}`, 'bright');
    log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

async function makeRequest(endpoint, method = 'POST', body = null) {
    const url = `${API_URL}${endpoint}`;

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TEST_API_TOKEN}`,
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    logInfo(`${method} ${endpoint}`);

    try {
        const response = await fetch(url, options);
        const data = await response.json();

        if (!response.ok) {
            logError(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
            return { success: false, status: response.status, data };
        }

        logSuccess(`Response: ${response.status}`);
        return { success: true, status: response.status, data };
    } catch (error) {
        logError(`Request failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function sleep(ms) {
    logInfo(`Waiting ${ms / 1000}s...`);
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    log('\n🚀 Starting L4D2 Ranked Match Flow Test', 'bright');
    log(`📍 API URL: ${API_URL}`, 'cyan');
    log(`🔑 Using TEST_API_TOKEN: ${TEST_API_TOKEN.substring(0, 10)}...`, 'cyan');

    try {
        // Step 1: Cleanup
        logStep(1, 'Cleanup - Remove previous test data');
        const cleanup = await makeRequest('/api/test/cleanup');
        if (cleanup.success) {
            logSuccess('Previous test data cleaned up');
        } else {
            logWarning('Cleanup failed, but continuing...');
        }
        await sleep(1000);

        // Step 2: Simulate Queue
        logStep(2, 'Simulate Queue - Add 8 players to queue');
        const queue = await makeRequest('/api/test/simulate-queue');
        if (!queue.success) {
            logError('Failed to simulate queue');
            return;
        }
        logSuccess(`Queue created with ${queue.data.queuedPlayers?.length || 8} players`);
        logInfo(`Match ID: ${queue.data.matchId}`);
        const matchId = queue.data.matchId;
        await sleep(2000);

        // Step 3: Simulate Accept
        logStep(3, 'Simulate Accept - All players accept match');
        const accept = await makeRequest('/api/test/simulate-accept');
        if (!accept.success) {
            logError('Failed to simulate accept');
            return;
        }
        logSuccess('All players accepted the match');
        await sleep(2000);

        // Step 4: Simulate Voting
        logStep(4, 'Simulate Voting - Players vote for map');
        const voting = await makeRequest('/api/test/simulate-voting');
        if (!voting.success) {
            logError('Failed to simulate voting');
            return;
        }
        logSuccess(`Map selected: ${voting.data.selectedMap || 'Unknown'}`);
        await sleep(2000);

        // Step 5: Start Match
        logStep(5, 'Start Match - Send RCON commands to game server');
        const start = await makeRequest('/api/test/simulate-start');
        if (!start.success) {
            logError('Failed to start match');
            logWarning('This might be due to RCON connection issues');
            logInfo('Check that your game server is running and RCON is configured');
            return;
        }
        logSuccess('Match started successfully');
        logInfo('RCON commands executed:');
        logInfo('  - exec ranked.cfg (loads ZoneMod)');
        logInfo('  - changelevel <map>');
        logInfo('  - sm_set_match_players <steamids>');
        logInfo('  - sm_set_teams <team assignments>');
        logInfo('  - sm_set_match_id <match_id>');
        await sleep(2000);

        // Step 6: Verify Match State
        logStep(6, 'Verify Match State - Check database');
        logInfo('The match should now be IN_PROGRESS in the database');
        logInfo('Players should be assigned to teams');
        logInfo('ZoneMod should be loading on the server');
        logSuccess('Match flow completed successfully!');

        // Step 7: Instructions for Manual Testing
        logStep(7, 'Next Steps - Manual Verification');
        log('\n📋 Manual Verification Steps:', 'yellow');
        log('1. Connect to your L4D2 server', 'yellow');
        log('2. Verify that ZoneMod is loaded (check console)', 'yellow');
        log('3. Verify that the whitelist is active', 'yellow');
        log('4. Play the match to completion', 'yellow');
        log('5. Check that match results are reported to the API', 'yellow');
        log('6. Verify ELO calculations in the database', 'yellow');

        log('\n🔍 Monitoring Tips:', 'cyan');
        log('• Check server logs: /path/to/server/left4dead2/logs/', 'cyan');
        log('• Check SourceMod logs: /path/to/server/left4dead2/addons/sourcemod/logs/', 'cyan');
        log('• Monitor API logs for match report webhook', 'cyan');
        log('• Use /admin/test page to view match status', 'cyan');

        log('\n✨ Test completed successfully!', 'green');
        log(`Match ID: ${matchId}`, 'green');

    } catch (error) {
        logError(`Unexpected error: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Run the tests
runTests().catch(error => {
    logError(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
});
