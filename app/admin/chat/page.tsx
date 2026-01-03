'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ADMIN_ROLES = ['OWNER', 'ADMIN', 'MODERATOR'];

interface MutedUser {
    id: string;
    reason: string | null;
    expiresAt: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        steamId: string;
    };
}

export default function AdminChatPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [mutes, setMutes] = useState<MutedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showMuteForm, setShowMuteForm] = useState(false);
    const [muteForm, setMuteForm] = useState({ steamId: '', reason: '', duration: 24 });

    // @ts-expect-error - role is custom field
    const userRole = session?.user?.role;
    const isAdmin = userRole && ADMIN_ROLES.includes(userRole);

    useEffect(() => {
        if (status === 'authenticated' && !isAdmin) {
            router.push('/');
        }
    }, [status, isAdmin, router]);

    useEffect(() => {
        fetchMutes();
    }, []);

    const fetchMutes = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/chat/mutes');
            const data = await res.json();
            if (data.success) {
                setMutes(data.mutes);
            }
        } catch (error) {
            console.error('Failed to fetch mutes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMute = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/chat/mute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(muteForm)
            });
            const data = await res.json();
            if (data.success) {
                setShowMuteForm(false);
                setMuteForm({ steamId: '', reason: '', duration: 24 });
                fetchMutes();
            } else {
                alert(data.error || 'Failed to mute user');
            }
        } catch (error) {
            console.error('Mute failed:', error);
        }
    };

    const handleUnmute = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/chat/mutes/${id}`, { method: 'DELETE' });
            if ((await res.json()).success) {
                fetchMutes();
            }
        } catch (error) {
            console.error('Unmute failed:', error);
        }
    };

    if (status === 'loading' || !isAdmin) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-black text-white">

            <div className="pt-24 pb-16 px-6">
                <div className="container mx-auto max-w-4xl">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="text-zinc-500 hover:text-white transition-colors">← Back</Link>
                            <h1 className="text-3xl font-black uppercase italic">💬 Chat Moderation</h1>
                        </div>
                        <button
                            onClick={() => setShowMuteForm(!showMuteForm)}
                            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 font-bold rounded-xl hover:bg-red-500/30 transition-colors"
                        >
                            🔇 Mute User
                        </button>
                    </div>

                    {/* Mute Form */}
                    {showMuteForm && (
                        <form onSubmit={handleMute} className="bg-zinc-900 border border-white/10 rounded-xl p-6 mb-8 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Player SteamID or Name</label>
                                <input
                                    type="text"
                                    required
                                    value={muteForm.steamId}
                                    onChange={(e) => setMuteForm({ ...muteForm, steamId: e.target.value })}
                                    className="w-full bg-black border border-white/10 rounded p-3 text-white"
                                    placeholder="76561198..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Reason</label>
                                    <input
                                        type="text"
                                        value={muteForm.reason}
                                        onChange={(e) => setMuteForm({ ...muteForm, reason: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded p-3 text-white"
                                        placeholder="Toxic behavior"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Duration (hours)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={muteForm.duration}
                                        onChange={(e) => setMuteForm({ ...muteForm, duration: parseInt(e.target.value) })}
                                        className="w-full bg-black border border-white/10 rounded p-3 text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button type="submit" className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl">
                                    Mute
                                </button>
                                <button type="button" onClick={() => setShowMuteForm(false)} className="px-6 py-3 bg-zinc-800 text-zinc-400 font-bold rounded-xl">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Active Mutes */}
                    <h2 className="text-xl font-bold text-zinc-400 mb-4">Active Mutes</h2>
                    {loading ? (
                        <div className="text-center py-12 text-zinc-500">Loading...</div>
                    ) : mutes.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500 bg-zinc-900/50 rounded-xl border border-white/5">
                            No active mutes
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {mutes.map((mute) => (
                                <div key={mute.id} className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-white">{mute.user.name}</div>
                                        <div className="text-sm text-zinc-500">
                                            Steam: {mute.user.steamId} | Reason: {mute.reason || 'Not specified'}
                                        </div>
                                        <div className="text-xs text-zinc-600">
                                            Expires: {new Date(mute.expiresAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleUnmute(mute.id)}
                                        className="px-4 py-2 bg-brand-green/20 text-brand-green border border-brand-green/30 font-bold rounded text-sm hover:bg-brand-green/30"
                                    >
                                        Unmute
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
