'use client';

import { useState } from 'react';
import { THEME_LIST, THEME_CATEGORIES, type ThemeName } from '@/lib/themes';
import { toast } from 'sonner';

interface ThemeSelectorProps {
    currentTheme: string;
    isPremium: boolean;
}

export default function ThemeSelector({ currentTheme, isPremium }: ThemeSelectorProps) {
    const [selectedTheme, setSelectedTheme] = useState<string>(currentTheme || 'emerald');
    const [loading, setLoading] = useState(false);

    console.log('ThemeSelector - isPremium:', isPremium);
    console.log('ThemeSelector - currentTheme:', currentTheme);

    if (!isPremium) {
        return (
            <div className="bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-black/95 border-2 border-amber-500/30 p-6 rounded-3xl backdrop-blur-xl">
                <div className="text-center py-8">
                    <span className="text-4xl mb-4 block">👑</span>
                    <h3 className="text-xl font-black text-amber-500 uppercase mb-2">Premium Feature</h3>
                    <p className="text-zinc-400 text-sm">Upgrade to Premium to unlock 15+ exclusive themes</p>
                </div>
            </div>
        );
    }

    const handleThemeChange = async (theme: ThemeName) => {
        if (loading) return;

        // Optimistic update - NO page reload
        const previousTheme = selectedTheme;
        setSelectedTheme(theme);
        setLoading(true);

        try {
            const response = await fetch('/api/profile/theme', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('✅ Theme saved!');
                // NO page reload - just update state
            } else {
                // Revert on error
                setSelectedTheme(previousTheme);
                toast.error(data.error || 'Failed to update theme');
            }
        } catch (error) {
            setSelectedTheme(previousTheme);
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-black/95 border-2 border-brand-green/40 p-6 rounded-3xl backdrop-blur-xl shadow-[0_20px_80px_-20px_rgba(74,222,128,0.3)]">
            <div className="mb-6">
                <h3 className="font-black text-white uppercase tracking-wider text-lg mb-2 flex items-center gap-2">
                    🎨 Theme Selector
                    <span className="text-xs font-normal text-brand-green bg-brand-green/20 px-2 py-1 rounded-full">
                        15 themes
                    </span>
                </h3>
                <p className="text-zinc-400 text-sm">
                    Choose your profile color scheme
                </p>
            </div>

            {/* Categorized Themes */}
            <div className="space-y-6">
                {Object.entries(THEME_CATEGORIES).map(([categoryKey, category]) => (
                    <div key={categoryKey}>
                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">
                            {category.name}
                        </h4>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            {category.themes.map((themeId) => {
                                const theme = THEME_LIST.find(t => t.id === themeId);
                                if (!theme) return null;

                                const isSelected = selectedTheme === theme.id;

                                return (
                                    <button
                                        key={theme.id}
                                        onClick={() => handleThemeChange(theme.id)}
                                        disabled={loading}
                                        className={`relative p-3 rounded-xl border-2 transition-all transform hover:-translate-y-1 hover:scale-105 ${isSelected
                                                ? 'border-white shadow-[0_0_20px_var(--glow)] scale-105'
                                                : 'border-white/10 hover:border-white/30'
                                            } ${loading ? 'opacity-50 cursor-wait' : ''}`}
                                        style={{
                                            '--glow': theme.glow,
                                            background: `linear-gradient(135deg, ${theme.primary}20, ${theme.accent}15)`,
                                        } as React.CSSProperties}
                                    >
                                        {/* Color circle */}
                                        <div
                                            className={`w-10 h-10 rounded-full mx-auto mb-2 shadow-lg transition-all ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''
                                                }`}
                                            style={{
                                                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                                                boxShadow: isSelected ? `0 0 20px ${theme.glow}` : 'none',
                                            }}
                                        />

                                        {/* Theme name */}
                                        <p
                                            className="font-bold text-[10px] uppercase tracking-wide text-center truncate"
                                            style={{ color: theme.primary }}
                                        >
                                            {theme.name}
                                        </p>

                                        {/* Selected checkmark */}
                                        {isSelected && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg">
                                                <span className="text-black text-xs">✓</span>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {loading && (
                <div className="mt-4 text-center text-zinc-400 text-sm animate-pulse">
                    Saving...
                </div>
            )}
        </div>
    );
}
