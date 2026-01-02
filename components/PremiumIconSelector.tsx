'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PREMIUM_ICONS } from './PremiumUsername';

interface PremiumIconSelectorProps {
    currentIcon: string;
}

export default function PremiumIconSelector({ currentIcon }: PremiumIconSelectorProps) {
    const [selectedIcon, setSelectedIcon] = useState(currentIcon || 'star');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleIconChange = async (iconId: string) => {
        if (loading) return;

        const previousIcon = selectedIcon;
        setSelectedIcon(iconId);
        setLoading(true);

        try {
            const response = await fetch('/api/profile/customize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ premiumIcon: iconId }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Icon saved!');
                router.refresh();
            } else {
                setSelectedIcon(previousIcon);
                toast.error(data.error || 'Failed to save');
            }
        } catch (error) {
            setSelectedIcon(previousIcon);
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">
                🏆 Premium Icon ({PREMIUM_ICONS.length} icons)
            </label>
            <p className="text-xs text-zinc-500 mb-3">
                This icon appears next to your username
            </p>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {PREMIUM_ICONS.map((icon) => (
                    <button
                        key={icon.id}
                        type="button"
                        onClick={() => handleIconChange(icon.id)}
                        disabled={loading}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 hover:scale-105 ${selectedIcon === icon.id
                                ? 'border-amber-400 bg-amber-500/10 scale-105'
                                : 'border-white/10 hover:border-white/30 bg-black/20'
                            } ${loading ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        <span className={`text-2xl ${icon.color}`}>
                            {icon.icon}
                        </span>
                        <span className="text-[8px] text-zinc-400 uppercase truncate w-full text-center">
                            {icon.name}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
