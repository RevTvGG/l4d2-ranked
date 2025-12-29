'use client';

import { useState } from 'react';

interface MedalProps {
    name: string;
    description: string;
    icon: string;
    color: string;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    awardedAt: string;
    note?: string | null;
}

const RARITY_STYLES = {
    COMMON: { border: 'border-zinc-600', glow: '', bg: 'bg-zinc-800' },
    RARE: { border: 'border-blue-500', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]', bg: 'bg-blue-500/10' },
    EPIC: { border: 'border-purple-500', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]', bg: 'bg-purple-500/10' },
    LEGENDARY: { border: 'border-yellow-500', glow: 'animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.4)]', bg: 'bg-yellow-500/10' },
};

export function MedalBadge({ name, description, icon, color, rarity, awardedAt, note }: MedalProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const style = RARITY_STYLES[rarity] || RARITY_STYLES.COMMON;

    return (
        <div
            className="relative group"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* Medal Icon Badge */}
            <div className={`
                w-16 h-16 rounded-xl flex items-center justify-center text-3xl
                border-2 ${style.border} ${style.bg} ${style.glow}
                transition-transform duration-300 hover:scale-110 hover:-translate-y-1 cursor-help
            `}>
                {icon}
            </div>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 z-50 pointer-events-none">
                    <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-md">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{icon}</span>
                            <div>
                                <h4 className="font-bold text-white text-sm" style={{ color: color }}>{name}</h4>
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/5`}>
                                    {rarity}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-zinc-400 text-xs leading-relaxed mb-3">
                            {description}
                        </p>

                        {/* Note (if any) */}
                        {note && (
                            <div className="mb-3 p-2 bg-white/5 rounded text-xs text-zinc-300 italic">
                                &quot;{note}&quot;
                            </div>
                        )}

                        {/* Footer */}
                        <div className="pt-2 border-t border-white/5 text-[10px] text-zinc-600">
                            Awarded: {new Date(awardedAt).toLocaleDateString()}
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-zinc-900"></div>
                </div>
            )}
        </div>
    );
}
