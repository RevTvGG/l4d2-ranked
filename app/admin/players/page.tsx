'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

const ADMIN_ROLES = ['OWNER', 'ADMIN', 'MODERATOR'];

interface Player {
    id: string;
    name: string;
    steamId: string;
    image: string;
    role: string;
    rating: number;
    wins: number;
    losses: number;
    banCount: number;
    createdAt: string;
}

export default function AdminPlayersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [players, setPlayers] = useState<Player[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // @ts-expect-error - role is custom field
    const userRole = session?.user?.role;
    const isAdmin = userRole && ADMIN_ROLES.includes(userRole);

    useEffect(() => {
        if (status === 'authenticated' && !isAdmin) {
            router.push('/');
        }
    }, [status, isAdmin, router]);

    useEffect(() => {
        fetchPlayers();
    }, []);

    const fetchPlayers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/players?search=${encodeURIComponent(search)}`);
            const data = await res.json();
            if (data.success) {
                setPlayers(data.players);
            }
        } catch (error) {
            console.error('Failed to fetch players:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPlayers();
    };

    const handleBan = async (userId: string, duration: number, reason: string) => {
        setActionLoading(userId);
        try {
            const res = await fetch(`/api/admin/players/${userId}/ban`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ duration, reason })
            });
            const data = await res.json();
            if (data.success) {
                fetchPlayers();
            } else {
                alert(data.error || 'Failed to ban player');
            }
        } catch (error) {
            console.error('Ban failed:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (userRole !== 'OWNER') {
            alert('Only the owner can change roles');
            return;
        }
        setActionLoading(userId);
        try {
            const res = await fetch(`/api/admin/players/${userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });
            const data = await res.json();
            if (data.success) {
                fetchPlayers();
            } else {
                alert(data.error || 'Failed to change role');
            }
        } catch (error) {
            console.error('Role change failed:', error);
        } finally {
            setActionLoading(null);
        }
    };

    if (status === 'loading' || !isAdmin) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-24 pb-16 px-6">
                <div className="container mx-auto max-w-6xl">

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/admin" className="text-zinc-500 hover:text-white transition-colors">← Back</Link>
                        <h1 className="text-3xl font-black uppercase italic">👥 Player Management</h1>
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="mb-8 flex gap-4">
                        <input
                            type="text"
                            placeholder="Search by name or SteamID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-green outline-none"
                        />
                        <button type="submit" className="px-6 py-3 bg-brand-green text-black font-bold rounded-xl hover:bg-white transition-colors">
                            Search
                        </button>
                    </form>

                    {/* Players List */}
                    {loading ? (
                        <div className="text-center py-12 text-zinc-500">Loading players...</div>
                    ) : players.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500">No players found</div>
                    ) : (
                        <div className="space-y-4">
                            {players.map((player) => (
                                <div key={player.id} className="bg-zinc-900 border border-white/5 rounded-xl p-6 flex items-center gap-6">
                                    {/* Avatar */}
                                    <img
                                        src={player.image || '/default_avatar.jpg'}
                                        alt={player.name || ''}
                                        className="w-16 h-16 rounded-xl"
                                    />

                                    {/* Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-bold text-lg text-white">{player.name}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded font-bold ${player.role === 'OWNER' ? 'bg-red-500/20 text-red-400' :
                                                    player.role === 'ADMIN' ? 'bg-orange-500/20 text-orange-400' :
                                                        player.role === 'MODERATOR' ? 'bg-blue-500/20 text-blue-400' :
                                                            'bg-zinc-800 text-zinc-500'
                                                }`}>
                                                {player.role}
                                            </span>
                                        </div>
                                        <div className="text-sm text-zinc-500 space-x-4">
                                            <span>SteamID: {player.steamId}</span>
                                            <span>Rating: {player.rating}</span>
                                            <span>W/L: {player.wins}/{player.losses}</span>
                                            <span>Bans: {player.banCount}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        {/* Role Selector (Owner only) */}
                                        {userRole === 'OWNER' && player.role !== 'OWNER' && (
                                            <select
                                                value={player.role}
                                                onChange={(e) => handleRoleChange(player.id, e.target.value)}
                                                disabled={actionLoading === player.id}
                                                className="bg-zinc-800 border border-white/10 rounded px-3 py-2 text-sm text-white"
                                            >
                                                <option value="Newcomer">User</option>
                                                <option value="MODERATOR">Moderator</option>
                                                <option value="ADMIN">Admin</option>
                                            </select>
                                        )}

                                        {/* Ban Button */}
                                        <button
                                            onClick={() => {
                                                const reason = prompt('Ban reason:');
                                                if (reason) {
                                                    const duration = parseInt(prompt('Duration in hours (e.g., 24 for 1 day, 168 for 1 week):') || '24');
                                                    handleBan(player.id, duration, reason);
                                                }
                                            }}
                                            disabled={actionLoading === player.id || player.role === 'OWNER'}
                                            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded font-bold text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                        >
                                            {actionLoading === player.id ? '...' : '🚫 Ban'}
                                        </button>

                                        {/* View Profile */}
                                        <Link
                                            href={`/profile/${encodeURIComponent(player.name || '')}`}
                                            className="px-4 py-2 bg-zinc-800 border border-white/10 rounded font-bold text-sm hover:bg-zinc-700 transition-colors"
                                        >
                                            View
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
