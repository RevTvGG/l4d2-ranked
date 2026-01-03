'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const ADMIN_ROLES = ['OWNER', 'ADMIN', 'MODERATOR'];

interface Ban {
    id: string;
    reason: string;
    description: string | null;
    duration: number;
    createdAt: string;
    expiresAt: string | null;
    active: boolean;
    unbannedAt: string | null;
    user: {
        id: string;
        name: string;
        steamId: string;
        image: string | null;
    };
    bannedBy: {
        name: string;
    } | null;
    unbannedBy: {
        name: string;
    } | null;
}

export default function AdminBansPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [bans, setBans] = useState<Ban[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBanForm, setShowBanForm] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('active');

    // Ban form state
    const [banForm, setBanForm] = useState({
        steamId: '',
        reason: 'MANUAL',
        description: '',
        duration: 60
    });

    // @ts-expect-error - role is custom field
    const userRole = session?.user?.role;
    const isAdmin = userRole && ADMIN_ROLES.includes(userRole);

    useEffect(() => {
        if (status === 'authenticated' && !isAdmin) {
            router.push('/');
        }
    }, [status, isAdmin, router]);

    useEffect(() => {
        fetchBans();
    }, [filter]);

    const fetchBans = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/bans?filter=${filter}`);
            const data = await res.json();
            if (data.bans) {
                setBans(data.bans);
            }
        } catch (error) {
            console.error('Failed to fetch bans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/bans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(banForm)
            });
            const data = await res.json();
            if (data.success) {
                setShowBanForm(false);
                setBanForm({ steamId: '', reason: 'MANUAL', description: '', duration: 60 });
                fetchBans();
            } else {
                alert(data.error || 'Failed to ban user');
            }
        } catch (error) {
            console.error('Ban failed:', error);
        }
    };

    const handleUnban = async (banId: string) => {
        if (!confirm('Are you sure you want to unban this player?')) return;

        try {
            const res = await fetch(`/api/admin/bans/${banId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchBans();
            } else {
                alert(data.error || 'Failed to unban');
            }
        } catch (error) {
            console.error('Unban failed:', error);
        }
    };

    const formatDuration = (minutes: number) => {
        if (minutes === 0) return 'Permanent';
        if (minutes < 60) return `${minutes}m`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
        return `${Math.floor(minutes / 1440)}d`;
    };

    const formatReason = (reason: string) => {
        const labels: Record<string, string> = {
            'AFK_ACCEPT': '⏰ AFK (Ready)',
            'NO_JOIN': '🚫 No Join',
            'CRASH': '💥 Crash',
            'MANUAL': '🔧 Manual',
            'TROLLING': '🤡 Trolling',
            'CHEATING': '🎮 Cheating'
        };
        return labels[reason] || reason;
    };

    if (status === 'loading' || !isAdmin) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-black text-white">

            <div className="pt-24 pb-16 px-6">
                <div className="container mx-auto max-w-6xl">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="text-zinc-500 hover:text-white transition-colors">← Back</Link>
                            <h1 className="text-3xl font-black uppercase italic">⛔ Ban Management</h1>
                        </div>
                        <button
                            onClick={() => setShowBanForm(!showBanForm)}
                            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 font-bold rounded-xl hover:bg-red-500/30 transition-colors"
                        >
                            + Ban Player
                        </button>
                    </div>

                    {/* Ban Form */}
                    {showBanForm && (
                        <form onSubmit={handleBan} className="bg-zinc-900 border border-white/10 rounded-xl p-6 mb-8 space-y-4">
                            <h2 className="text-xl font-bold mb-4">Ban a Player</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">SteamID or Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={banForm.steamId}
                                        onChange={(e) => setBanForm({ ...banForm, steamId: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded p-3 text-white"
                                        placeholder="76561198..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Reason</label>
                                    <select
                                        value={banForm.reason}
                                        onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded p-3 text-white"
                                    >
                                        <option value="MANUAL">Manual</option>
                                        <option value="TROLLING">Trolling</option>
                                        <option value="CHEATING">Cheating</option>
                                        <option value="AFK_ACCEPT">AFK (Ready Check)</option>
                                        <option value="NO_JOIN">No Join</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Duration</label>
                                    <select
                                        value={banForm.duration}
                                        onChange={(e) => setBanForm({ ...banForm, duration: parseInt(e.target.value) })}
                                        className="w-full bg-black border border-white/10 rounded p-3 text-white"
                                    >
                                        <option value={15}>15 minutes</option>
                                        <option value={30}>30 minutes</option>
                                        <option value={60}>1 hour</option>
                                        <option value={180}>3 hours</option>
                                        <option value={360}>6 hours</option>
                                        <option value={720}>12 hours</option>
                                        <option value={1440}>1 day</option>
                                        <option value={4320}>3 days</option>
                                        <option value={10080}>1 week</option>
                                        <option value={43200}>1 month</option>
                                        <option value={0}>Permanent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Description (optional)</label>
                                    <input
                                        type="text"
                                        value={banForm.description}
                                        onChange={(e) => setBanForm({ ...banForm, description: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded p-3 text-white"
                                        placeholder="Additional details..."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button type="submit" className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl">
                                    Ban Player
                                </button>
                                <button type="button" onClick={() => setShowBanForm(false)} className="px-6 py-3 bg-zinc-800 text-zinc-400 font-bold rounded-xl">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-6">
                        {(['active', 'expired', 'all'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg font-bold text-sm uppercase transition-colors ${filter === f
                                    ? 'bg-brand-green text-black'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Bans List */}
                    {loading ? (
                        <div className="text-center py-12 text-zinc-500">Loading...</div>
                    ) : bans.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500 bg-zinc-900/50 rounded-xl border border-white/5">
                            No bans found
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {bans.map((ban) => (
                                <div key={ban.id} className={`bg-zinc-900 border rounded-xl p-4 flex items-center justify-between ${ban.active ? 'border-red-500/30' : 'border-white/5 opacity-60'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800">
                                            {ban.user.image ? (
                                                <Image src={ban.user.image} alt="" width={48} height={48} className="object-cover" unoptimized />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                                    {ban.user.name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{ban.user.name}</div>
                                            <div className="text-sm text-zinc-500">{ban.user.steamId}</div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-white">{formatReason(ban.reason)}</div>
                                        <div className="text-xs text-zinc-500">{ban.description || 'No description'}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-white">{formatDuration(ban.duration)}</div>
                                        <div className="text-xs text-zinc-500">
                                            {ban.expiresAt ? new Date(ban.expiresAt).toLocaleDateString() : 'Never'}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-zinc-500">Banned by</div>
                                        <div className="text-sm text-white">{ban.bannedBy?.name || 'System'}</div>
                                    </div>
                                    <div>
                                        {ban.active ? (
                                            <button
                                                onClick={() => handleUnban(ban.id)}
                                                className="px-4 py-2 bg-brand-green/20 text-brand-green border border-brand-green/30 font-bold rounded text-sm hover:bg-brand-green/30"
                                            >
                                                Unban
                                            </button>
                                        ) : (
                                            <span className="text-sm text-zinc-500">
                                                {ban.unbannedBy ? `Unbanned by ${ban.unbannedBy.name}` : 'Expired'}
                                            </span>
                                        )}
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
