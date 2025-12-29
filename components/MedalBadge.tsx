'use client';

import { useState } from 'react';

interface MedalBadgeProps {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    awardedAt: string;
    note?: string | null;
    onRemove?: (id: string) => void;
}

export function MedalBadge({ id, name, description, icon, color, rarity, awardedAt, note, onRemove }: MedalBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    const rarityColors = {
        COMMON: 'border-zinc-700 bg-zinc-800/50',
        RARE: 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_10px_-3px_rgba(59,130,246,0.3)]',
        EPIC: 'border-purple-500/50 bg-purple-500/10 shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]',
        LEGENDARY: 'border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_20px_-3px_rgba(234,179,8,0.3)]',
    };

    const rarityTextColors = {
        COMMON: 'text-zinc-400',
        RARE: 'text-blue-400',
        EPIC: 'text-purple-400',
        LEGENDARY: 'text-yellow-400',
    };

    return (
        <div
            className={`group relative flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-105 cursor-help ${rarityColors[rarity]}`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* Remove Button (Only for Owners) */}
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to remove the "${name}" medal from this player?`)) {
                            onRemove(id);
                        }
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-600 shadow-md transform hover:scale-110"
                    title="Revoke Medal"
                >
                    ✕
                </button>
            )}

            <div className="text-2xl filter drop-shadow-md">{icon}</div>

            <div>
                <div className={`text-sm font-bold uppercase tracking-tight ${rarityTextColors[rarity]}`}>
                    {name}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                    {new Date(awardedAt).toLocaleDateString()}
                </div>
            </div>

            {/* HOVER TOOLTIP */}
            {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 rounded-lg bg-zinc-950 border border-white/10 shadow-xl z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className={`text-xs font-bold mb-1 ${rarityTextColors[rarity]}`}>{rarity} MEDAL</div>
                    <div className="text-xs text-zinc-300 leading-relaxed mb-2">
                        {description}
                    </div>
                    {note && (
                        <div className="text-[10px] text-zinc-500 italic border-t border-white/5 pt-2 mt-2">
                            &quot;{note}&quot;
                        </div>
                    )}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-950"></div>
                </div>
            )}
        </div>
    );
}
