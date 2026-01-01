'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface ReportButtonProps {
    reportedUserId: string;
    reportedUserName: string;
    matchId?: string; // Optional: for reporting from match history
}

export default function ReportButton({ reportedUserId, reportedUserName, matchId }: ReportButtonProps) {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState<'CHEATING' | 'TROLLING'>('CHEATING');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);

        try {
            const res = await fetch('/api/user/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportedUserId,
                    reason,
                    description: description.trim() || null,
                    matchId: matchId || null // Include match context if available
                })
            });

            const data = await res.json();

            if (res.ok) {
                setSubmitted(true);
                setTimeout(() => {
                    setIsOpen(false);
                    setSubmitted(false);
                    setDescription('');
                }, 2000);
            } else {
                alert(data.error || 'Failed to submit report');
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            alert('Failed to submit report');
        } finally {
            setSubmitting(false);
        }
    };

    // Don't show if not logged in or viewing own profile
    // @ts-expect-error - custom field
    if (!session || session.user?.id === reportedUserId) {
        return null;
    }

    return (
        <>
            {/* Report Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-2 text-sm font-medium"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12.435 12.435 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A19.626 19.626 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a19.587 19.587 0 0 0 1.349-.476l.019-.007.004-.002h.001" />
                </svg>
                Report Player
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        {submitted ? (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-4">✅</div>
                                <h3 className="text-xl font-bold text-white">Report Submitted</h3>
                                <p className="text-zinc-500 mt-2">Thank you for helping keep the community safe.</p>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold text-white mb-2">Report {reportedUserName}</h3>
                                <p className="text-zinc-500 text-sm mb-6">
                                    Please select a reason and provide details. False reports may result in penalties.
                                </p>

                                {/* Reason Selection */}
                                <div className="space-y-3 mb-6">
                                    <label className="text-xs font-bold text-zinc-400 uppercase">Reason</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setReason('CHEATING')}
                                            className={`p-3 rounded-lg border text-sm font-medium transition-colors ${reason === 'CHEATING'
                                                ? 'bg-red-500/20 border-red-500 text-red-400'
                                                : 'bg-zinc-800 border-white/10 text-zinc-400 hover:border-white/20'
                                                }`}
                                        >
                                            🎮 Cheating
                                        </button>
                                        <button
                                            onClick={() => setReason('TROLLING')}
                                            className={`p-3 rounded-lg border text-sm font-medium transition-colors ${reason === 'TROLLING'
                                                ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                                                : 'bg-zinc-800 border-white/10 text-zinc-400 hover:border-white/20'
                                                }`}
                                        >
                                            🤡 Trolling
                                        </button>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-3 mb-6">
                                    <label className="text-xs font-bold text-zinc-400 uppercase">
                                        Details (Optional)
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe what happened..."
                                        className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-white placeholder-zinc-600 resize-none h-24 focus:outline-none focus:border-red-500/50"
                                        maxLength={500}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="flex-1 py-3 bg-zinc-800 text-zinc-400 rounded-lg font-medium hover:bg-zinc-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="flex-1 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 disabled:opacity-50 transition-colors"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Report'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
