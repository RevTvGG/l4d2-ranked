'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

export default function AdminPanel() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState<any>(null);
    const [queue, setQueue] = useState<any[]>([]);
    const [players, setPlayers] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [bans, setBans] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Check if user is admin
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
        if (status === 'authenticated') {
            const userSteamId = (session?.user as any)?.steamId;
            const isAdmin = userSteamId === '76561198113376372'; // Your Steam ID
            if (!isAdmin) {
                router.push('/');
            }
        }
    }, [status, session, router]);

    // Load data based on active tab
    useEffect(() => {
        loadTabData();
    }, [activeTab]);

    const loadTabData = async () => {
        setLoading(true);
        try {
            switch (activeTab) {
                case 'queue':
                    const queueRes = await fetch('/api/admin/queue');
                    const queueData = await queueRes.json();
                    setQueue(queueData.queue || []);
                    break;
                case 'players':
                    const playersRes = await fetch('/api/admin/players');
                    const playersData = await playersRes.json();
                    setPlayers(playersData.players || []);
                    break;
                case 'matches':
                    const matchesRes = await fetch('/api/admin/matches');
                    const matchesData = await matchesRes.json();
                    setMatches(matchesData.matches || []);
                    break;
                case 'bans':
                    const bansRes = await fetch('/api/admin/bans');
                    const bansData = await bansRes.json();
                    setBans(bansData.bans || []);
                    break;
            }
        } catch (error) {
            console.error('Error loading tab data:', error);
        }
        setLoading(false);
    };

    const handleForceMatch = async () => {
        if (!confirm('Force create match with current queue?')) return;

        try {
            const res = await fetch('/api/admin/force-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ minPlayers: 2 })
            });
            const data = await res.json();

            if (data.success) {
                alert(`Match created! ${data.match.players} players`);
                loadTabData();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Failed to create match');
        }
    };

    const handleClearQueue = async () => {
        if (!confirm('Clear entire queue?')) return;

        try {
            const res = await fetch('/api/admin/queue', { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                alert(data.message);
                loadTabData();
            }
        } catch (error) {
            alert('Failed to clear queue');
        }
    };

    const handleBanPlayer = async (userId: string) => {
        const reason = prompt('Ban reason:');
        if (!reason) return;

        const type = prompt('Ban type (GAME/CHAT/BOTH):')?.toUpperCase();
        if (!['GAME', 'CHAT', 'BOTH'].includes(type || '')) {
            alert('Invalid ban type');
            return;
        }

        const durationStr = prompt('Duration in minutes (leave empty for permanent):');
        const duration = durationStr ? parseInt(durationStr) : null;

        try {
            const res = await fetch('/api/admin/ban-player', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, reason, type, duration })
            });
            const data = await res.json();

            if (data.success) {
                alert(`Player banned: ${data.ban.type} for ${data.ban.duration}`);
                loadTabData();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Failed to ban player');
        }
    };

    const handleUnban = async (banId: string) => {
        if (!confirm('Remove this ban?')) return;

        try {
            const res = await fetch('/api/admin/unban-player', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ banId })
            });
            const data = await res.json();

            if (data.success) {
                alert('Ban removed');
                loadTabData();
            }
        } catch (error) {
            alert('Failed to unban');
        }
    };

    if (status === 'loading') {
        return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading...</div>;
    }

    const userSteamId = (session?.user as any)?.steamId;
    const isUserAdmin = userSteamId === '76561198113376372';

    if (!isUserAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <Navbar />

            <div className="pt-24 px-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-brand-green mb-2">🛡️ ADMIN PANEL</h1>
                    <p className="text-zinc-400">System management and moderation tools</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto">
                    {['dashboard', 'queue', 'players', 'matches', 'bans'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-lg font-bold uppercase tracking-wide transition-all ${activeTab === tab
                                ? 'bg-brand-green text-black'
                                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                    {loading && <div className="text-center py-8 text-zinc-400">Loading...</div>}

                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && !loading && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={handleForceMatch}
                                    className="bg-brand-green hover:bg-lime-400 text-black font-bold py-4 px-6 rounded-xl transition-all"
                                >
                                    ⚡ Force Match (Any Number)
                                </button>
                                <button
                                    onClick={handleClearQueue}
                                    className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-6 rounded-xl transition-all"
                                >
                                    🗑️ Clear Queue
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Queue Tab */}
                    {activeTab === 'queue' && !loading && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold">Queue ({queue.length})</h2>
                                <button
                                    onClick={handleClearQueue}
                                    className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg"
                                >
                                    Clear All
                                </button>
                            </div>
                            {queue.length === 0 ? (
                                <p className="text-zinc-400 text-center py-8">Queue is empty</p>
                            ) : (
                                <div className="grid gap-3">
                                    {queue.map((entry: any) => (
                                        <div key={entry.id} className="bg-zinc-800 p-4 rounded-lg flex items-center gap-4">
                                            <img
                                                src={entry.user.image || '/default-avatar.png'}
                                                alt={entry.user.name}
                                                className="w-12 h-12 rounded-full"
                                            />
                                            <div className="flex-1">
                                                <div className="font-bold">{entry.user.name}</div>
                                                <div className="text-sm text-zinc-400">{entry.user.steamId}</div>
                                            </div>
                                            <div className="text-brand-green font-mono">{entry.user.rating} ELO</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Players Tab */}
                    {activeTab === 'players' && !loading && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold mb-4">Players ({players.length})</h2>
                            <div className="grid gap-3">
                                {players.map((player: any) => (
                                    <div key={player.id} className="bg-zinc-800 p-4 rounded-lg flex items-center gap-4">
                                        <img
                                            src={player.image || '/default-avatar.png'}
                                            alt={player.name}
                                            className="w-12 h-12 rounded-full"
                                        />
                                        <div className="flex-1">
                                            <div className="font-bold">{player.name}</div>
                                            <div className="text-sm text-zinc-400">
                                                {player.wins}W / {player.losses}L • {player.rating} ELO
                                            </div>
                                        </div>
                                        {player.bans.length > 0 && (
                                            <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                                                BANNED
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleBanPlayer(player.id)}
                                            className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg"
                                        >
                                            Ban
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Matches Tab */}
                    {activeTab === 'matches' && !loading && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold">Matches ({matches.length})</h2>
                                <button
                                    onClick={handleForceMatch}
                                    className="bg-brand-green hover:bg-lime-400 text-black font-bold py-2 px-4 rounded-lg"
                                >
                                    Force Match
                                </button>
                            </div>
                            <div className="grid gap-3">
                                {matches.map((match: any) => (
                                    <div key={match.id} className="bg-zinc-800 p-4 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-mono text-sm text-zinc-400">{match.id}</span>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${match.status === 'COMPLETED' ? 'bg-green-600' :
                                                match.status === 'IN_PROGRESS' ? 'bg-blue-600' :
                                                    'bg-yellow-600'
                                                }`}>
                                                {match.status}
                                            </span>
                                        </div>
                                        <div className="text-sm text-zinc-400">
                                            {match.players.length} players • {new Date(match.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bans Tab */}
                    {activeTab === 'bans' && !loading && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold mb-4">Active Bans ({bans.length})</h2>
                            <div className="grid gap-3">
                                {bans.map((ban: any) => (
                                    <div key={ban.id} className="bg-zinc-800 p-4 rounded-lg">
                                        <div className="flex items-center gap-4 mb-2">
                                            <img
                                                src={ban.user.image || '/default-avatar.png'}
                                                alt={ban.user.name}
                                                className="w-10 h-10 rounded-full"
                                            />
                                            <div className="flex-1">
                                                <div className="font-bold">{ban.user.name}</div>
                                                <div className="text-sm text-zinc-400">{ban.reason}</div>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${ban.type === 'GAME' ? 'bg-red-600' :
                                                ban.type === 'CHAT' ? 'bg-yellow-600' :
                                                    'bg-purple-600'
                                                }`}>
                                                {ban.type}
                                            </span>
                                            <button
                                                onClick={() => handleUnban(ban.id)}
                                                className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg"
                                            >
                                                Unban
                                            </button>
                                        </div>
                                        <div className="text-xs text-zinc-500">
                                            {ban.expiresAt ? `Expires: ${new Date(ban.expiresAt).toLocaleString()}` : 'Permanent'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
