'use client';

import { useState, useEffect } from 'react';
import { getStuckMatches, adminCancelMatch, adminResetAllStuckMatches, createTestMatch, resendMatchId } from '@/app/actions/admin';

interface StuckMatch {
    id: string;
    status: string;
    createdAt: string;
    players: { user: { name: string } }[];
    server?: { name: string };
}

export default function StuckMatchesPanel() {
    const [matches, setMatches] = useState<StuckMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<string | null>(null);

    const loadMatches = async () => {
        setLoading(true);
        const result = await getStuckMatches();
        setMatches(result.matches || []);
        setLoading(false);
    };

    useEffect(() => {
        loadMatches();
    }, []);

    const handleCancelMatch = async (matchId: string) => {
        const result = await adminCancelMatch(matchId);
        if (result.success) {
            setMessage(result.message || 'Match cancelled');
            loadMatches();
        } else {
            setMessage(result.error || 'Failed');
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleResetAll = async () => {
        if (!confirm('Cancel ALL stuck matches and clear ALL queues?')) return;
        const result = await adminResetAllStuckMatches();
        if (result.success) {
            setMessage(result.message || 'All reset');
            loadMatches();
        } else {
            setMessage(result.error || 'Failed');
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleCreateTest = async () => {
        setLoading(true);
        const result = await createTestMatch();
        if (result.success) {
            setMessage('Test match created! Go to /play');
            loadMatches();
        } else {
            setMessage(result.error || 'Failed');
        }
        setLoading(false);
        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="bg-zinc-900/50 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-red-400">🚨 Stuck Matches</h3>
                <div className="flex gap-2">
                    <button
                        onClick={loadMatches}
                        className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded"
                    >
                        🔄 Refresh
                    </button>
                    <button
                        onClick={handleResetAll}
                        className="px-3 py-1 text-xs bg-red-600 hover:bg-red-500 rounded font-bold"
                    >
                        ☢️ RESET ALL
                    </button>
                    <button
                        onClick={handleCreateTest}
                        className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded font-bold"
                    >
                        🧪 TEST MATCH
                    </button>
                </div>
            </div>

            {message && (
                <div className="mb-3 p-2 bg-brand-green/20 border border-brand-green/50 rounded text-sm text-brand-green">
                    {message}
                </div>
            )}

            {loading ? (
                <div className="text-zinc-500 text-sm">Loading...</div>
            ) : matches.length === 0 ? (
                <div className="text-zinc-500 text-sm">✅ No stuck matches</div>
            ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {matches.map(match => (
                        <div key={match.id} className="flex items-center justify-between bg-zinc-800/50 p-3 rounded-lg">
                            <div>
                                <div className="text-sm font-mono text-zinc-300">
                                    {match.id.slice(0, 8)}...
                                </div>
                                <div className="text-xs text-zinc-500">
                                    Status: <span className="text-yellow-400">{match.status}</span>
                                    {' • '}
                                    {match.players?.length || 0} players
                                    {match.server && ` • ${match.server.name}`}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        if (!confirm('Resend Match ID via RCON?')) return;
                                        setLoading(true);
                                        const res = await resendMatchId(match.id);
                                        alert(res.success ? res.message : res.error);
                                        setLoading(false);
                                    }}
                                    className="px-3 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded border border-blue-500/30"
                                >
                                    🔄 Resend ID
                                </button>
                                <button
                                    onClick={() => handleCancelMatch(match.id)}
                                    className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded border border-red-500/30"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
