'use client';

import { useState } from 'react';
import ReportModal from './ReportModal';
import { useSession } from 'next-auth/react';

export default function GlobalReportButton() {
    const { status } = useSession();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Only show for authenticated users
    if (status !== 'authenticated') return null;

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-zinc-900 border border-white/10 hover:border-brand-green text-zinc-400 hover:text-white rounded-full shadow-2xl transition-all hover:scale-105 group"
            >
                <span className="text-xl">📣</span>
                <span className="font-bold text-sm hidden group-hover:inline-block animate-in fade-in slide-in-from-right-2 duration-300">
                    Report Issue
                </span>
            </button>

            <ReportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
