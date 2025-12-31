'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { BanModal } from '@/components/BanModal';
import { PremiumBadge } from '@/components/PremiumBadge';
import { AwardMedalModal } from '@/components/admin/AwardMedalModal';

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
    activeBanId: string | null;
    createdAt: string;
}

export default function AdminPlayersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [players, setPlayers] = useState<Player[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Medal Modal State
    const [showAwardModal, setShowAwardModal] = useState(false);
    const [playerForMedal, setPlayerForMedal] = useState<Player | null>(null);

    // Delete Confirmation State
    const [deleteConfirm, setDeleteConfirm] = useState<{ player: Player; step: 1 | 2 } | null>(null);

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

    const handleBan = async (data: { steamId: string; reason: string; duration: number; description: string }) => {
        if (!selectedPlayer) return;

        setActionLoading(selectedPlayer.id);
        try {
            const res = await fetch(`/api/admin/players/${selectedPlayer.id}/ban`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const responseData = await res.json();
            if (responseData.success) {
                fetchPlayers();
                setSelectedPlayer(null);
            } else {
                alert(responseData.error || 'Failed to ban player');
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

    const handleAwardMedal = async (medalId: string, note: string) => {
        if (!playerForMedal) return;

        try {
            const res = await fetch('/api/admin/medals/award', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: playerForMedal.id,
                    medalId,
                    note
                })
            });

            const data = await res.json();
            if (data.success) {
                alert(`Medal awarded to ${playerForMedal.name}!`);
            } else {
                alert(data.error || 'Failed to award medal');
            }
        } catch (error) {
            console.error('Failed to award medal:', error);
            alert('Failed to award medal');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        setActionLoading(userId);
        try {
            const res = await fetch(`/api/admin/players/${userId}/delete`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                fetchPlayers();
            } else {
                alert(data.error || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete user');
        } finally {
            setActionLoading(null);
            setDeleteConfirm(null);
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
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-bold text-lg text-white flex items-center gap-2">
                                                {player.name}
                                                {/* @ts-expect-error - isPremium added in api */}
                                                {player.isPremium && <PremiumBadge theme="GOLD" />}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded font-bold ${player.role === 'OWNER' ? 'bg-red-500/20 text-red-400' :
                                                player.role === 'ADMIN' ? 'bg-orange-500/20 text-orange-400' :
                                                    player.role === 'MODERATOR' ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-zinc-800 text-zinc-500'
                                                }`}>
                                                {player.role}
                                            </span>
                                            {/* Beta Verification Badge */}
                                            {/* @ts-expect-error - betaAccess added in api */}
                                            {player.betaAccess && (
                                                <div className="group relative">
                                                    <span className="bg-brand-green/10 text-brand-green border border-brand-green/20 p-1 rounded-md" title="Beta Verified">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </span>
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white/10 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                        Beta Verified
                                                    </div>
                                                </div>
                                            )}
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
                                        {/* Role Selector (Owner & Admin) */}
                                        {['OWNER', 'ADMIN'].includes(userRole as string) && player.role !== 'OWNER' && (
                                            <select
                                                value={player.role}
                                                onChange={(e) => handleRoleChange(player.id, e.target.value)}
                                                disabled={actionLoading === player.id || (userRole === 'ADMIN' && player.role === 'ADMIN')}
                                                className="bg-zinc-800 border border-white/10 rounded px-3 py-2 text-sm text-white"
                                            >
                                                <option value="Newcomer">User</option>
                                                <option value="MODERATOR">Moderator</option>
                                                {userRole === 'OWNER' && (
                                                    <option value="ADMIN">Admin</option>
                                                )}
                                            </select>
                                        )
                                        }

                                        {/* Ban/Unban Button */}
                                        {
                                            player.activeBanId ? (
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm('Are you sure you want to unban this player?')) return;
                                                        setActionLoading(player.id);
                                                        try {
                                                            const res = await fetch(`/api/admin/bans/${player.activeBanId}`, { method: 'DELETE' });
                                                            const data = await res.json();
                                                            if (data.success) {
                                                                fetchPlayers();
                                                            } else {
                                                                alert(data.error || 'Failed to unban');
                                                            }
                                                        } catch (error) {
                                                            console.error('Unban failed:', error);
                                                        } finally {
                                                            setActionLoading(null);
                                                        }
                                                    }}
                                                    disabled={actionLoading === player.id}
                                                    className="px-4 py-2 bg-brand-green/20 text-brand-green border border-brand-green/30 rounded font-bold text-sm hover:bg-brand-green/30 transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === player.id ? '...' : '✅ Unban'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setSelectedPlayer(player)}
                                                    disabled={actionLoading === player.id || player.role === 'OWNER'}
                                                    className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded font-bold text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === player.id ? '...' : '🚫 Ban'}
                                                </button>
                                            )
                                        }

                                        {/* Award Medal Button */}
                                        {userRole === 'OWNER' && (
                                            <button
                                                onClick={() => {
                                                    setPlayerForMedal(player);
                                                    setShowAwardModal(true);
                                                }}
                                                className="px-3 py-1 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 rounded-lg transition-colors border border-yellow-500/20 font-bold text-sm flex items-center gap-2"
                                                title="Award Medal"
                                            >
                                                <span>🏅Award</span>
                                            </button>
                                        )}

                                        {/* View Profile */}
                                        <Link
                                            href={`/profile/${encodeURIComponent(player.name || '')}`}
                                            className="px-4 py-2 bg-zinc-800 border border-white/10 rounded font-bold text-sm hover:bg-zinc-700 transition-colors"
                                        >
                                            View
                                        </Link>

                                        {/* Delete User Button (OWNER and ADMIN) */}
                                        {/* OWNER can delete anyone except OWNER */}
                                        {/* ADMIN can delete regular users and mods, but not other ADMINs */}
                                        {(['OWNER', 'ADMIN'].includes(userRole as string)) &&
                                            player.role !== 'OWNER' &&
                                            !(userRole === 'ADMIN' && player.role === 'ADMIN') && (
                                                <button
                                                    onClick={() => setDeleteConfirm({ player, step: 1 })}
                                                    disabled={actionLoading === player.id}
                                                    className="px-3 py-2 bg-red-900/30 text-red-500 border border-red-500/30 rounded font-bold text-sm hover:bg-red-900/50 transition-colors disabled:opacity-50"
                                                    title="Delete User"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Ban Modal */}
                    {selectedPlayer && (
                        <BanModal
                            isOpen={!!selectedPlayer}
                            onClose={() => setSelectedPlayer(null)}
                            onBan={handleBan}
                            initialSteamId={selectedPlayer?.steamId || ''}
                            initialPlayerName={selectedPlayer?.name}
                        />
                    )}

                    {/* Award Medal Modal */}
                    {playerForMedal && (
                        <AwardMedalModal
                            isOpen={showAwardModal}
                            onClose={() => setShowAwardModal(false)}
                            onAward={handleAwardMedal}
                            playerName={playerForMedal?.name || ''}
                            userId={playerForMedal?.id || ''}
                        />
                    )}

                    {/* Delete Confirmation Modal (Double Confirmation) */}
                    {deleteConfirm && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                            <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-8 max-w-md w-full">
                                {deleteConfirm.step === 1 ? (
                                    <>
                                        <h2 className="text-2xl font-black text-red-500 mb-4">⚠️ Delete User?</h2>
                                        <p className="text-zinc-400 mb-6">
                                            You are about to delete <span className="text-white font-bold">{deleteConfirm.player.name}</span>.
                                            This will remove ALL their data including matches, stats, and messages.
                                        </p>
                                        <p className="text-red-400 text-sm mb-6 bg-red-500/10 p-3 rounded-lg">
                                            ⚠️ This action is IRREVERSIBLE!
                                        </p>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="flex-1 px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl font-bold hover:bg-zinc-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm({ ...deleteConfirm, step: 2 })}
                                                className="flex-1 px-4 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold hover:bg-red-500/30 transition-colors"
                                            >
                                                Continue →
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-black text-red-500 mb-4">🚨 FINAL CONFIRMATION</h2>
                                        <p className="text-zinc-400 mb-4">
                                            Type <span className="text-red-400 font-mono bg-red-500/10 px-2 py-1 rounded">DELETE</span> to confirm permanent deletion of:
                                        </p>
                                        <p className="text-white font-bold text-xl mb-6 text-center">
                                            {deleteConfirm.player.name}
                                        </p>
                                        <input
                                            type="text"
                                            placeholder="Type DELETE"
                                            id="delete-confirm-input"
                                            className="w-full bg-black border border-red-500/30 rounded-xl px-4 py-3 text-white text-center font-mono mb-6 focus:border-red-500 outline-none"
                                        />
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="flex-1 px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl font-bold hover:bg-zinc-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const input = document.getElementById('delete-confirm-input') as HTMLInputElement;
                                                    if (input?.value === 'DELETE') {
                                                        handleDeleteUser(deleteConfirm.player.id);
                                                    } else {
                                                        alert('Please type DELETE to confirm');
                                                    }
                                                }}
                                                disabled={actionLoading === deleteConfirm.player.id}
                                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500 transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === deleteConfirm.player.id ? 'Deleting...' : '🗑️ DELETE PERMANENTLY'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div >
        </div >
    );
}
