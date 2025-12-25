'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';

export default function AdminTestPage() {
    const [output, setOutput] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const log = (message: string) => {
        setOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    const clearOutput = () => setOutput([]);

    // Test 1: Create 8 fake players in queue
    const testCreateQueue = async () => {
        setLoading(true);
        clearOutput();
        log('🧪 Starting Queue Test...');

        try {
            const response = await fetch('/api/test/simulate-queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerCount: 8 })
            });

            const data = await response.json();

            if (data.success) {
                log(`✅ Created ${data.playersCreated} players in queue`);
                log(`✅ Match created: ${data.matchId}`);
                log(`✅ Status: ${data.matchStatus}`);
            } else {
                log(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            log(`❌ Exception: ${error}`);
        }

        setLoading(false);
    };

    // Test 2: Simulate all players accepting
    const testAcceptMatch = async () => {
        setLoading(true);
        log('🧪 Simulating all players accepting...');

        try {
            const response = await fetch('/api/test/simulate-accept', {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                log(`✅ ${data.playersAccepted} players accepted`);
                log(`✅ Match status: ${data.matchStatus}`);
            } else {
                log(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            log(`❌ Exception: ${error}`);
        }

        setLoading(false);
    };

    // Test 3: Simulate map voting
    const testMapVoting = async () => {
        setLoading(true);
        log('🧪 Simulating map voting...');

        try {
            const response = await fetch('/api/test/simulate-voting', {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                log(`✅ All players voted`);
                log(`✅ Selected map: ${data.selectedMap}`);
                log(`✅ Match status: ${data.matchStatus}`);
            } else {
                log(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            log(`❌ Exception: ${error}`);
        }

        setLoading(false);
    };

    // Test 4: Start match on server
    const testStartMatch = async () => {
        setLoading(true);
        log('🧪 Starting match on server...');

        try {
            const response = await fetch('/api/test/simulate-start', {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                log(`✅ Server commands sent`);
                log(`✅ Map: ${data.map}`);
                log(`✅ Server: ${data.server}`);
            } else {
                log(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            log(`❌ Exception: ${error}`);
        }

        setLoading(false);
    };

    // Test 5: Complete flow (all steps)
    const testCompleteFlow = async () => {
        setLoading(true);
        clearOutput();
        log('🚀 Starting COMPLETE matchmaking flow test...');
        log('');

        // Step 1: Create queue
        log('📝 Step 1: Creating 8 players in queue...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            const queueRes = await fetch('/api/test/simulate-queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerCount: 8 })
            });
            const queueData = await queueRes.json();

            if (!queueData.success) {
                log(`❌ Failed at queue creation: ${queueData.error}`);
                setLoading(false);
                return;
            }

            log(`✅ Queue created with ${queueData.playersCreated} players`);
            log(`✅ Match ID: ${queueData.matchId}`);
            log('');

            // Step 2: Accept match
            log('📝 Step 2: All players accepting match...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            const acceptRes = await fetch('/api/test/simulate-accept', {
                method: 'POST'
            });
            const acceptData = await acceptRes.json();

            if (!acceptData.success) {
                log(`❌ Failed at accept: ${acceptData.error}`);
                setLoading(false);
                return;
            }

            log(`✅ ${acceptData.playersAccepted} players accepted`);
            log('');

            // Step 3: Vote map
            log('📝 Step 3: Voting for map...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            const voteRes = await fetch('/api/test/simulate-voting', {
                method: 'POST'
            });
            const voteData = await voteRes.json();

            if (!voteData.success) {
                log(`❌ Failed at voting: ${voteData.error}`);
                setLoading(false);
                return;
            }

            log(`✅ Map selected: ${voteData.selectedMap}`);
            log('');

            // Step 4: Start server
            log('📝 Step 4: Starting match on server...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            const startRes = await fetch('/api/test/simulate-start', {
                method: 'POST'
            });
            const startData = await startRes.json();

            if (!startData.success) {
                log(`❌ Failed at server start: ${startData.error}`);
                setLoading(false);
                return;
            }

            log(`✅ Server started`);
            log(`✅ Map: ${startData.map}`);
            log(`✅ Server: ${startData.server}`);
            log('');
            log('🎉 COMPLETE FLOW TEST SUCCESSFUL!');
            log('');
            log('Next steps:');
            log('1. Check your L4D2 server console');
            log('2. Verify map changed');
            log('3. Verify whitelist is active');
            log('4. Connect to server and play!');

        } catch (error) {
            log(`❌ Exception: ${error}`);
        }

        setLoading(false);
    };

    // Clean up test data
    const cleanupTestData = async () => {
        setLoading(true);
        log('🧹 Cleaning up test data...');

        try {
            const response = await fetch('/api/test/cleanup', {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                log(`✅ Deleted ${data.queueEntriesDeleted} queue entries`);
                log(`✅ Deleted ${data.matchesDeleted} test matches`);
                log(`✅ Cleanup complete`);
            } else {
                log(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            log(`❌ Exception: ${error}`);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <Navbar />

            <div className="container mx-auto px-6 pt-32 pb-12">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-black uppercase tracking-tight">
                            🧪 Admin <span className="text-brand-green">Testing</span>
                        </h1>
                        <p className="text-zinc-400">
                            Simulate complete matchmaking flow without needing 8 players
                        </p>
                    </div>

                    {/* Test Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={testCreateQueue}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed p-4 rounded-lg font-bold transition-colors"
                        >
                            1️⃣ Create Queue (8 Players)
                        </button>

                        <button
                            onClick={testAcceptMatch}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:cursor-not-allowed p-4 rounded-lg font-bold transition-colors"
                        >
                            2️⃣ Accept Match (All)
                        </button>

                        <button
                            onClick={testMapVoting}
                            disabled={loading}
                            className="bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:cursor-not-allowed p-4 rounded-lg font-bold transition-colors"
                        >
                            3️⃣ Vote Map (All)
                        </button>

                        <button
                            onClick={testStartMatch}
                            disabled={loading}
                            className="bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-700 disabled:cursor-not-allowed p-4 rounded-lg font-bold transition-colors"
                        >
                            4️⃣ Start Server
                        </button>

                        <button
                            onClick={testCompleteFlow}
                            disabled={loading}
                            className="md:col-span-2 bg-brand-green hover:bg-lime-400 text-black disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed p-6 rounded-lg font-black uppercase tracking-wide transition-colors"
                        >
                            🚀 Run Complete Flow Test
                        </button>

                        <button
                            onClick={cleanupTestData}
                            disabled={loading}
                            className="md:col-span-2 bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 disabled:cursor-not-allowed p-4 rounded-lg font-bold transition-colors"
                        >
                            🧹 Cleanup Test Data
                        </button>
                    </div>

                    {/* Output Console */}
                    <div className="bg-black border border-white/10 rounded-lg p-6 font-mono text-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-brand-green">Console Output</h3>
                            <button
                                onClick={clearOutput}
                                className="text-xs text-zinc-500 hover:text-white"
                            >
                                Clear
                            </button>
                        </div>

                        <div className="space-y-1 max-h-96 overflow-y-auto">
                            {output.length === 0 ? (
                                <div className="text-zinc-600 italic">
                                    No output yet. Click a test button to start.
                                </div>
                            ) : (
                                output.map((line, i) => (
                                    <div key={i} className={
                                        line.includes('✅') ? 'text-green-400' :
                                            line.includes('❌') ? 'text-red-400' :
                                                line.includes('🧪') || line.includes('🚀') ? 'text-brand-green font-bold' :
                                                    line.includes('📝') ? 'text-blue-400 font-bold' :
                                                        line.includes('🎉') ? 'text-yellow-400 font-bold' :
                                                            'text-zinc-400'
                                    }>
                                        {line}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-6 space-y-4">
                        <h3 className="font-bold text-lg">📖 How to Use</h3>
                        <div className="space-y-2 text-sm text-zinc-400">
                            <p><strong className="text-white">Individual Tests:</strong> Run steps 1-4 in order to test each phase separately</p>
                            <p><strong className="text-white">Complete Flow:</strong> Click "Run Complete Flow Test" to simulate the entire matchmaking process automatically</p>
                            <p><strong className="text-white">Cleanup:</strong> Use "Cleanup Test Data" to remove all test players and matches from the database</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
