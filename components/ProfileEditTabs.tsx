'use client';

import { useState, ReactNode } from 'react';

interface Tab {
    id: string;
    label: string;
    icon: string;
    content: ReactNode;
}

interface ProfileEditTabsProps {
    tabs: Tab[];
    defaultTab?: string;
}

export default function ProfileEditTabs({ tabs, defaultTab }: ProfileEditTabsProps) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

    const activeContent = tabs.find(t => t.id === activeTab)?.content;

    return (
        <div className="w-full">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-6 p-1 bg-zinc-900/50 rounded-2xl border border-white/5">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl font-bold uppercase text-sm tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === tab.id
                                ? 'bg-brand-green text-black shadow-lg shadow-brand-green/20'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                {activeContent}
            </div>
        </div>
    );
}
