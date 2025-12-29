'use client';

import { useState, useEffect } from 'react';
import { getProfile } from '@/app/actions/getProfile';

interface Medal {
    id: string;
    name: string;
    icon: string;
    rarity: string;
    color: string;
}

interface UserMedal {
    id: string; // This is medalId from getProfile mapping
    name: string;
    rarity: string;
    icon: string;
    color: string;
}

interface AwardMedalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAward: (medalId: string, note: string) => Promise<void>;
    playerName: string;
    userId: string;
}

export function AwardMedalModal({ isOpen, onClose, onAward, playerName, userId }: AwardMedalModalProps) {
    const [medals, setMedals] = useState<Medal[]>([]);
    const [userMedals, setUserMedals] = useState<UserMedal[]>([]);
    const [selectedMedal, setSelectedMedal] = useState<string>('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [revoking, setRevoking] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchData();
            setNote('');
            setSelectedMedal('');
        }
    }, [isOpen, playerName]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all available medals
            const medalsRes = await fetch('/api/admin/medals');
            const medalsData = await medalsRes.json();

            // Fetch user's current medals
            const profile = await getProfile(playerName);

            if (medalsData.success) {
                setMedals(medalsData.medals);
                if (medalsData.medals.length > 0) {
                    setSelectedMedal(medalsData.medals[0].id);
                }
            }

            if (profile && profile.medals) {
                setUserMedals(profile.medals.map((m: any) => ({
                    id: m.id,
                    name: m.name,
                    rarity: m.rarity,
                    icon: m.icon,
                    color: m.color
                })));
            } else {
                setUserMedals([]);
            }

        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMedal) return;

        setSubmitting(true);
        try {
            await onAward(selectedMedal, note);
            onClose();
        } catch (error) {
            console.error('Failed to award medal:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevoke = async (medalId: string) => {
        if (!confirm('Permanently remove this medal from the user?')) return;

        setRevoking(medalId);
        try {
            const res = await fetch(`/api/admin/medals/revoke?userId=${userId}&medalId=${medalId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                // Remove from local state
                setUserMedals(prev => prev.filter(m => m.id !== medalId));
            } else {
                alert('Failed to revoke medal');
            }
        } catch (error) {
            console.error('Revoke failed:', error);
            alert('Error revoking medal');
        } finally {
            setRevoking(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Manage Medals</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
                </div>

                <p className="text-zinc-400 text-sm mb-6">
                    Player: <span className="text-brand-green font-bold">{playerName}</span>
                </p>

                {loading ? (
                    <div className="text-center py-8 text-zinc-500">Loading data...</div>
                ) : (
                    <div className="space-y-8">

                        {/* CURRENT MEDALS SECTION */}
                        <div>
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Current Medals ({userMedals.length})</h3>
                            {userMedals.length === 0 ? (
                                <div className="text-sm text-zinc-600 italic px-2">No medals awarded yet.</div>
                            ) : (
                                <div className="space-y-2">
                                    {userMedals.map(m => (
                                        <div key={m.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{m.icon}</span>
                                                <div>
                                                    <div className="text-sm font-bold text-zinc-200">{m.name}</div>
                                                    <div className="text-[10px] text-zinc-500 uppercase">{m.rarity}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRevoke(m.id)}
                                                disabled={revoking === m.id}
                                                className="px-3 py-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-xs font-bold rounded transition-colors"
                                            >
                                                {revoking === m.id ? '...' : 'Remove'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="h-px bg-white/10"></div>

                        {/* AWARD NEW MEDAL SECTION */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Award New Medal</h3>
                                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {medals.length === 0 && <div className="text-sm text-zinc-500">No medals available to award. Create some first!</div>}
                                    {medals.map((medal) => (
                                        <label
                                            key={medal.id}
                                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedMedal === medal.id
                                                ? 'bg-brand-green/10 border-brand-green'
                                                : 'bg-zinc-800 border-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="medal"
                                                value={medal.id}
                                                checked={selectedMedal === medal.id}
                                                onChange={(e) => setSelectedMedal(e.target.value)}
                                                className="hidden"
                                            />
                                            <div className="text-2xl">{medal.icon}</div>
                                            <div className="flex-1">
                                                <div className="font-bold text-sm" style={{ color: medal.color }}>{medal.name}</div>
                                                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{medal.rarity}</div>
                                            </div>
                                            {selectedMedal === medal.id && (
                                                <div className="text-brand-green">✓</div>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Note (Optional)</label>
                                <input
                                    type="text"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="e.g., Season 1 Champion"
                                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-green transition-colors"
                                />
                            </div>

                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
                                >
                                    Done
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !selectedMedal || medals.length === 0}
                                    className="px-6 py-2 bg-brand-green text-black text-sm font-bold rounded-lg hover:bg-lime-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Awarding...' : 'Award Selected'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
