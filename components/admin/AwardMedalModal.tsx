'use client';

import { useState, useEffect } from 'react';

interface Medal {
    id: string;
    name: string;
    icon: string;
    rarity: string;
    color: string;
}

interface AwardMedalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAward: (medalId: string, note: string) => Promise<void>;
    playerName: string;
}

export function AwardMedalModal({ isOpen, onClose, onAward, playerName }: AwardMedalModalProps) {
    const [medals, setMedals] = useState<Medal[]>([]);
    const [selectedMedal, setSelectedMedal] = useState<string>('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchMedals();
            setNote('');
            setSelectedMedal('');
        }
    }, [isOpen]);

    const fetchMedals = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/medals');
            const data = await res.json();
            if (data.success) {
                setMedals(data.medals);
                if (data.medals.length > 0) {
                    setSelectedMedal(data.medals[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch medals:', error);
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-2">Award Medal</h2>
                <p className="text-zinc-400 text-sm mb-6">
                    Awarding medal to <span className="text-brand-green font-bold">{playerName}</span>
                </p>

                {loading ? (
                    <div className="text-center py-8 text-zinc-500">Loading medals...</div>
                ) : medals.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-zinc-500 mb-4">No medals found.</p>
                        <button onClick={onClose} className="text-brand-green hover:underline">Close</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Select Medal</label>
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
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
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !selectedMedal}
                                className="px-6 py-2 bg-brand-green text-black text-sm font-bold rounded-lg hover:bg-lime-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Awarding...' : 'Award Medal'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
