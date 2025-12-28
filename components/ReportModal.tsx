'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

type ReportType = 'BUG' | 'PLAYER' | 'FEEDBACK';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ReportModal({ isOpen, onClose }: ReportModalProps) {
    const { data: session } = useSession();
    const [type, setType] = useState<ReportType>('BUG');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [target, setTarget] = useState(''); // Cheater name/steamid
    const [evidence, setEvidence] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    title,
                    content,
                    evidence,
                    target: type === 'PLAYER' ? target : undefined
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit report');
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
                // Reset form after closing
                setTimeout(() => {
                    setSuccess(false);
                    setTitle('');
                    setContent('');
                    setTarget('');
                    setEvidence('');
                    setType('BUG');
                }, 300);
            }, 2000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    ✕
                </button>

                {success ? (
                    <div className="p-12 text-center space-y-4 animate-in zoom-in duration-300">
                        <div className="text-5xl mb-4">✅</div>
                        <h3 className="text-2xl font-bold text-white">Report Sent!</h3>
                        <p className="text-zinc-400">Thank you for helping us improve the platform.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <h2 className="text-2xl font-black text-white italic uppercase">
                                Report Issue
                            </h2>
                            <p className="text-zinc-500 text-sm">
                                Reporting as <strong className="text-brand-green">{session?.user?.name}</strong>
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* Type Selection */}
                        <div className="grid grid-cols-3 gap-2">
                            {(['BUG', 'PLAYER', 'FEEDBACK'] as ReportType[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`py-2 px-1 text-xs font-bold uppercase rounded border transition-all ${type === t
                                            ? t === 'BUG' ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                                                : t === 'PLAYER' ? 'bg-red-500/20 border-red-500 text-red-400'
                                                    : 'bg-blue-500/20 border-blue-500 text-blue-400'
                                            : 'bg-zinc-800 border-transparent text-zinc-500 hover:bg-zinc-700'
                                        }`}
                                >
                                    {t === 'PLAYER' ? 'Cheater/Toxic' : t}
                                </button>
                            ))}
                        </div>

                        {/* Dynamic Fields */}
                        <div className="space-y-4">

                            {type === 'PLAYER' && (
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Target Player</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="SteamID or Name of the player"
                                        value={target}
                                        onChange={(e) => setTarget(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded p-3 text-white focus:border-brand-green outline-none transition-colors"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={100}
                                    placeholder={type === 'BUG' ? "e.g. Map voting not working" : "Brief summary"}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded p-3 text-white focus:border-brand-green outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Description</label>
                                <textarea
                                    required
                                    maxLength={1000}
                                    rows={4}
                                    placeholder="Please provide details..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded p-3 text-white focus:border-brand-green outline-none transition-colors resize-none"
                                />
                                <div className="text-right text-xs text-zinc-600 mt-1">
                                    {content.length}/1000
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Evidence (Optional)</label>
                                <input
                                    type="url"
                                    placeholder="https://imgur.com/..."
                                    value={evidence}
                                    onChange={(e) => setEvidence(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded p-3 text-white focus:border-brand-green outline-none transition-colors text-sm"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-white text-black font-black uppercase tracking-widest hover:bg-brand-green transition-colors disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isSubmitting ? 'Sending...' : 'Submit Report'}
                        </button>

                    </form>
                )}
            </div>
        </div>
    );
}
