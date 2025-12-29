'use client';

import { useState, useEffect } from 'react';

interface BanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBan: (data: { steamId: string; reason: string; duration: number; description: string }) => Promise<void>;
    initialSteamId?: string;
    initialPlayerName?: string;
}

export function BanModal({ isOpen, onClose, onBan, initialSteamId = '', initialPlayerName }: BanModalProps) {
    const [steamId, setSteamId] = useState(initialSteamId);
    const [reason, setReason] = useState('MANUAL');
    const [duration, setDuration] = useState(60);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSteamId(initialSteamId);
            setReason('MANUAL');
            setDuration(60);
            setDescription('');
        }
    }, [isOpen, initialSteamId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onBan({ steamId, reason, duration, description });
            onClose();
        } catch (error) {
            console.error('Ban error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            🚫 Ban Player
                            {initialPlayerName && <span className="text-zinc-500 font-normal">({initialPlayerName})</span>}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-zinc-500 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Target User */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">SteamID or Name</label>
                            <input
                                type="text"
                                required
                                value={steamId}
                                onChange={(e) => setSteamId(e.target.value)}
                                disabled={!!initialSteamId}
                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="76561198..."
                            />
                        </div>

                        {/* Reason */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Reason</label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white appearance-none cursor-pointer hover:border-white/20 transition-colors"
                            >
                                <option value="MANUAL">🔧 Manual / Other</option>
                                <option value="TROLLING">🤡 Trolling / Griefing</option>
                                <option value="CHEATING">🎮 Cheating / Exploits</option>
                                <option value="TOXICITY">🤬 Toxicity / Harassment</option>
                                <option value="AFK_ACCEPT">⏰ AFK (Ready Check)</option>
                                <option value="NO_JOIN">🚫 No Join</option>
                            </select>
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Duration</label>
                            <select
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value))}
                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white appearance-none cursor-pointer hover:border-white/20 transition-colors"
                            >
                                <option value={15}>15 minutes</option>
                                <option value={30}>30 minutes</option>
                                <option value={60}>1 hour</option>
                                <option value={180}>3 hours</option>
                                <option value={360}>6 hours</option>
                                <option value={720}>12 hours (Half day)</option>
                                <option value={1440}>1 day</option>
                                <option value={4320}>3 days</option>
                                <option value={10080}>1 week</option>
                                <option value={43200}>1 month</option>
                                <option value={525600}>1 year</option>
                                <option value={0}>⛔ Permanent Ban</option>
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Description (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white min-h-[80px] resize-none focus:outline-none focus:border-brand-green/50 transition-colors"
                                placeholder="Add context for this ban (visible to admins)..."
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-zinc-800 text-zinc-400 font-bold rounded-xl hover:bg-zinc-700 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Banning...
                                </>
                            ) : (
                                'Confirm Ban'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
