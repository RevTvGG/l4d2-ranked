'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PREMIUM_FONTS, GRADIENT_PRESETS } from '@/lib/premium';

// Extended Avatar Frames
export const AVATAR_FRAMES = [
    { id: 'NONE', name: 'None', style: 'border-2 border-white/20', glow: '' },
    { id: 'GOLD', name: 'Gold', style: 'border-4 border-amber-400', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.6)]' },
    { id: 'DIAMOND', name: 'Diamond', style: 'border-4 border-cyan-300', glow: 'shadow-[0_0_15px_rgba(34,211,238,0.6)]' },
    { id: 'FIRE', name: 'Fire', style: 'border-4 border-orange-500', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.6)]' },
    { id: 'ICE', name: 'Ice', style: 'border-4 border-blue-400', glow: 'shadow-[0_0_15px_rgba(96,165,250,0.6)]' },
    { id: 'ELECTRIC', name: 'Electric', style: 'border-4 border-violet-500', glow: 'shadow-[0_0_15px_rgba(139,92,246,0.6)]' },
    { id: 'RAINBOW', name: 'Rainbow', style: 'border-4 border-transparent bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 bg-clip-border', glow: 'shadow-[0_0_20px_rgba(244,114,182,0.5)]' },
    { id: 'EMERALD', name: 'Emerald', style: 'border-4 border-emerald-400', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.6)]' },
    { id: 'RUBY', name: 'Ruby', style: 'border-4 border-red-500', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.6)]' },
    { id: 'PLASMA', name: 'Plasma', style: 'border-4 border-pink-500', glow: 'shadow-[0_0_20px_rgba(236,72,153,0.6)] animate-pulse' },
    { id: 'VOID', name: 'Void', style: 'border-4 border-purple-900', glow: 'shadow-[0_0_25px_rgba(88,28,135,0.8)]' },
    { id: 'LEGENDARY', name: 'Legendary', style: 'border-4 border-yellow-300 animate-pulse', glow: 'shadow-[0_0_25px_rgba(253,224,71,0.7)]' },
];

interface PremiumCustomizationProps {
    user: {
        customFont?: string | null;
        profileFrame?: string | null;
        customTitle?: string | null;
        nameGradient?: string | null;
        profileGlow?: boolean;
    };
}

export default function PremiumCustomization({ user }: PremiumCustomizationProps) {
    const [customFont, setCustomFont] = useState(user?.customFont || 'default');
    const [profileFrame, setProfileFrame] = useState(user?.profileFrame || 'NONE');
    const [customTitle, setCustomTitle] = useState(user?.customTitle || '');
    const [nameGradient, setNameGradient] = useState(user?.nameGradient || '');
    const [profileGlow, setProfileGlow] = useState(user?.profileGlow || false);
    const [saving, setSaving] = useState<string | null>(null);

    const MAX_TITLE_LENGTH = 10;

    const router = useRouter();

    const saveField = async (field: string, value: any) => {
        setSaving(field);
        try {
            const response = await fetch('/api/profile/customize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Saved!');
                router.refresh();
            } else {
                toast.error(data.error || 'Failed to save');
            }
        } catch (error) {
            toast.error('Network error');
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-black/95 border-2 border-amber-500/40 p-6 rounded-3xl backdrop-blur-xl shadow-[0_20px_80px_-20px_rgba(245,158,11,0.3)]">
            <div className="mb-6">
                <h3 className="font-black text-amber-500 uppercase tracking-wider text-lg mb-2 flex items-center gap-2">
                    👑 Premium Customization
                    <span className="text-xs font-normal text-amber-500 bg-amber-500/20 px-2 py-1 rounded-full">
                        Exclusive
                    </span>
                </h3>
            </div>

            <div className="space-y-8">
                {/* Typography Selector */}
                <div>
                    <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">
                        ✨ Typography Style
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {PREMIUM_FONTS.map((font) => (
                            <button
                                key={font.id}
                                type="button"
                                onClick={() => {
                                    setCustomFont(font.id);
                                    saveField('customFont', font.id);
                                }}
                                disabled={saving === 'customFont'}
                                className={`p-4 rounded-xl border-2 transition-all ${customFont === font.id
                                    ? 'border-amber-400 bg-amber-500/10'
                                    : 'border-white/10 hover:border-white/30 bg-black/20'
                                    } ${saving === 'customFont' ? 'opacity-50' : ''}`}
                            >
                                <span className={`${font.class} text-lg text-white block mb-1`}>
                                    Aa
                                </span>
                                <span className="text-xs text-zinc-400 uppercase">
                                    {font.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Avatar Frame Selector */}
                <div>
                    <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">
                        🖼️ Avatar Frame ({AVATAR_FRAMES.length} frames)
                    </label>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                        {AVATAR_FRAMES.map((frame) => (
                            <button
                                key={frame.id}
                                type="button"
                                onClick={() => {
                                    setProfileFrame(frame.id);
                                    saveField('profileFrame', frame.id);
                                }}
                                disabled={saving === 'profileFrame'}
                                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center ${profileFrame === frame.id
                                    ? 'border-amber-400 bg-amber-500/10'
                                    : 'border-white/10 hover:border-white/30 bg-black/20'
                                    } ${saving === 'profileFrame' ? 'opacity-50' : ''}`}
                            >
                                {/* Preview circle with frame */}
                                <div className={`w-10 h-10 rounded-full ${frame.style} ${frame.glow} bg-zinc-700 mb-2`} />
                                <span className="text-[10px] text-zinc-400 uppercase truncate w-full text-center">
                                    {frame.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Title with limit */}
                <div>
                    <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">
                        📝 Custom Title
                        <span className={`ml-2 text-xs ${customTitle.length >= MAX_TITLE_LENGTH ? 'text-red-400' : 'text-zinc-500'}`}>
                            {customTitle.length}/{MAX_TITLE_LENGTH}
                        </span>
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
                            maxLength={MAX_TITLE_LENGTH}
                            placeholder="Your title..."
                            className="flex-1 bg-black/40 border-2 border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => saveField('customTitle', customTitle)}
                            disabled={saving === 'customTitle'}
                            className="px-4 py-3 bg-amber-500/20 border-2 border-amber-500/50 rounded-xl text-amber-500 font-bold hover:bg-amber-500/30 transition-all disabled:opacity-50"
                        >
                            {saving === 'customTitle' ? '...' : 'Save'}
                        </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">Displayed below your username</p>
                </div>

                {/* Name Gradient */}
                <div>
                    <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">
                        🌈 Name Gradient
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {/* None option */}
                        <button
                            type="button"
                            onClick={() => {
                                setNameGradient('');
                                saveField('nameGradient', '');
                            }}
                            className={`p-3 rounded-xl border-2 transition-all ${!nameGradient
                                ? 'border-amber-400 bg-amber-500/10'
                                : 'border-white/10 hover:border-white/30 bg-zinc-800/50'
                                }`}
                        >
                            <span className="text-base text-white font-bold">None</span>
                        </button>
                        {GRADIENT_PRESETS.map((gradient) => (
                            <button
                                key={gradient.id}
                                type="button"
                                onClick={() => {
                                    setNameGradient(gradient.css);
                                    saveField('nameGradient', gradient.css);
                                }}
                                disabled={saving === 'nameGradient'}
                                className={`p-3 rounded-xl border-2 transition-all ${nameGradient === gradient.css
                                    ? 'border-amber-400 bg-amber-500/10'
                                    : 'border-white/10 hover:border-white/30 bg-zinc-800/50'
                                    }`}
                            >
                                <span
                                    className="text-base font-black"
                                    style={{
                                        background: gradient.css,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    }}
                                >
                                    {gradient.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Avatar Glow Toggle */}
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border-2 border-white/10">
                    <div>
                        <h4 className="font-bold text-white">✨ Avatar Glow Effect</h4>
                        <p className="text-xs text-zinc-400">Pulsing glow around your avatar</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            const newValue = !profileGlow;
                            setProfileGlow(newValue);
                            saveField('profileGlow', newValue);
                        }}
                        disabled={saving === 'profileGlow'}
                        className={`w-14 h-8 rounded-full transition-all ${profileGlow
                            ? 'bg-amber-500'
                            : 'bg-zinc-700'
                            } ${saving === 'profileGlow' ? 'opacity-50' : ''}`}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${profileGlow ? 'translate-x-7' : 'translate-x-1'
                            }`} />
                    </button>
                </div>
            </div>
        </div>
    );
}
