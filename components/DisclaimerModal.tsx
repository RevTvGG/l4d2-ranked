'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: 'INFO' | 'WARNING' | 'MAINTENANCE';
    location: string;
}

export default function GenericAnnouncementModal() {
    const { data: session, status } = useSession();
    const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Only show for authenticated users
        if (status !== 'authenticated' || !session?.user) return;

        const checkAnnouncements = async () => {
            try {
                const res = await fetch('/api/announcements');
                const data = await res.json();

                if (data.success && data.announcements.length > 0) {
                    // Find the first unseen announcement
                    for (const ann of data.announcements) {
                        const seenKey = `l4d2ranked_seen_${ann.id}`;
                        const hasSeen = localStorage.getItem(seenKey);

                        if (!hasSeen) {
                            setCurrentAnnouncement(ann);
                            setIsOpen(true);
                            break; // Show one at a time
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to check announcements', error);
            }
        };

        checkAnnouncements();
    }, [status, session?.user]);

    const handleAccept = () => {
        if (currentAnnouncement) {
            const seenKey = `l4d2ranked_seen_${currentAnnouncement.id}`;
            localStorage.setItem(seenKey, 'true');
            setIsOpen(false);

            // Optional: Check for more announcements after closing
            // For now, simpler to just wait for next page load or session check
        }
    };

    if (!isOpen || !currentAnnouncement) return null;

    // Theme configuration based on type
    const theme = {
        INFO: {
            border: 'border-blue-500/30',
            bg: 'bg-blue-500/10',
            text: 'text-blue-400',
            icon: '📢',
            gradient: 'from-blue-500/20 to-cyan-500/20',
            button: 'bg-blue-500 shadow-blue-500/20',
        },
        WARNING: {
            border: 'border-yellow-500/30',
            bg: 'bg-yellow-500/10',
            text: 'text-yellow-400',
            icon: '⚠️',
            gradient: 'from-yellow-500/20 to-orange-500/20',
            button: 'bg-brand-green shadow-brand-green/20', // Keep brand green for "Beta" feel
        },
        MAINTENANCE: {
            border: 'border-red-500/30',
            bg: 'bg-red-500/10',
            text: 'text-red-400',
            icon: '🚨',
            gradient: 'from-red-500/20 to-pink-500/20',
            button: 'bg-red-500 shadow-red-500/20',
        }
    }[currentAnnouncement.type] || {
        border: 'border-white/10',
        bg: 'bg-zinc-800',
        text: 'text-white',
        icon: 'ℹ️',
        gradient: 'from-zinc-800 to-zinc-900',
        button: 'bg-white text-black',
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
                {/* Header */}
                <div className={`bg-gradient-to-r ${theme.gradient} border-b ${theme.border} p-6`}>
                    <div className="flex items-center gap-3">
                        <span className="text-4xl shadow-sm">{theme.icon}</span>
                        <div>
                            <h2 className={`text-2xl font-black uppercase tracking-tight ${theme.text}`}>
                                {currentAnnouncement.title}
                            </h2>
                            <p className="text-white/60 text-sm">System Announcement</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className={`rounded-xl p-4 md:p-6 bg-black/20 border ${theme.border}`}>
                        <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {currentAnnouncement.content}
                        </div>
                    </div>

                    {/* Footer / Accept */}
                    <div className="bg-zinc-800/50 rounded-xl p-4 text-center border border-white/5">
                        <p className="text-zinc-500 text-xs mb-4">
                            By clicking &quot;I Understand&quot;, this message will be dismissed.
                        </p>
                        <button
                            onClick={handleAccept}
                            className={`px-8 py-3 bg-white text-black font-black uppercase tracking-wide rounded-xl hover:scale-105 transition-all shadow-lg ${theme.button}`}
                        >
                            ✓ I Understand
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

