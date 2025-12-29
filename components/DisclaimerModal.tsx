'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function DisclaimerModal() {
    const { data: session, status } = useSession();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Only show for authenticated users
        if (status !== 'authenticated' || !session?.user) return;

        // Check if user has already seen the disclaimer
        const disclaimerKey = `l4d2ranked_disclaimer_seen_${session.user.id}`;
        const hasSeen = localStorage.getItem(disclaimerKey);

        if (!hasSeen) {
            setIsOpen(true);
        }
    }, [status, session?.user]);

    const handleAccept = () => {
        if (session?.user) {
            const disclaimerKey = `l4d2ranked_disclaimer_seen_${session.user.id}`;
            localStorage.setItem(disclaimerKey, 'true');
        }
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-b border-yellow-500/30 p-6">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">⚠️</span>
                        <div>
                            <h2 className="text-2xl font-black text-yellow-400 uppercase tracking-tight">
                                Beta Notice
                            </h2>
                            <p className="text-yellow-200/80 text-sm">Please read before playing</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Development Warning */}
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                        <h3 className="font-bold text-yellow-400 mb-2 flex items-center gap-2">
                            <span>🚧</span> Platform in Development
                        </h3>
                        <p className="text-zinc-300 text-sm leading-relaxed">
                            L4D2 Ranked is currently in <strong className="text-yellow-400">BETA</strong>.
                            You may experience bugs, errors, or unexpected behavior.
                            We are actively working to improve the platform.
                        </p>
                    </div>

                    {/* Potential Issues */}
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                        <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2">
                            <span>❗</span> Known Limitations
                        </h3>
                        <ul className="text-zinc-300 text-sm space-y-1 list-disc list-inside">
                            <li>Matchmaking may occasionally fail to connect</li>
                            <li>Stats may not update immediately after matches</li>
                            <li>Server connection issues may occur</li>
                            <li>Some features are still being implemented</li>
                        </ul>
                    </div>

                    {/* How to Report */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                        <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                            <span>📢</span> Found a Bug?
                        </h3>
                        <p className="text-zinc-300 text-sm">
                            Please report any issues to our Discord server or contact an admin.
                            Your feedback helps us improve!
                        </p>
                    </div>

                    {/* Critical FAQ Warning */}
                    <div className="bg-zinc-900 border-2 border-brand-green/50 rounded-xl p-5 text-center space-y-2 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-brand-green"></div>
                        <h3 className="text-brand-green font-black uppercase text-lg tracking-widest">
                            Important / Importante
                        </h3>
                        <p className="text-white font-medium text-sm">
                            Before playing, you <strong>MUST</strong> read our <span className="text-brand-green underline decoration-dashed underline-offset-4 cursor-help" title="Go to FAQ page">FAQ & Ban Policies</span>.
                        </p>
                        <p className="text-zinc-400 text-xs italic">
                            Antes de jugar, <strong>DEBES</strong> leer nuestras Políticas de Baneo y FAQ.
                        </p>
                    </div>

                    {/* Acceptance */}
                    <div className="bg-zinc-800 rounded-xl p-4 text-center">
                        <p className="text-zinc-400 text-sm mb-4">
                            By clicking &quot;I Understand&quot;, you acknowledge that this platform is in beta
                            and may have issues. This message will not appear again.
                        </p>
                        <button
                            onClick={handleAccept}
                            className="px-8 py-3 bg-brand-green text-black font-bold uppercase tracking-wide rounded-xl hover:scale-105 transition-transform shadow-lg shadow-brand-green/20"
                        >
                            ✓ I Understand
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
