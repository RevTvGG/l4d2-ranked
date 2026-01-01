'use client';

import { useState } from 'react';
import { THEME_LIST, type ThemeName } from '@/lib/themes';
import { toast } from 'sonner';

interface ThemeSelectorProps {
    currentTheme: string;
    isPremium: boolean;
}

export default function ThemeSelector({ currentTheme, isPremium }: ThemeSelectorProps) {
    const [selectedTheme, setSelectedTheme] = useState<string>(currentTheme || 'emerald');
    const [loading, setLoading] = useState(false);

    // Debug logging
    console.log('ThemeSelector - isPremium:', isPremium);
    console.log('ThemeSelector - currentTheme:', currentTheme);

    if (!isPremium) {
        return (
            <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6 text-center">
                <p className="text-zinc-400 mb-2">🎨 Custom themes are a</p>
                <p className="text-brand-green font-bold text-lg">PREMIUM</p>
                <p className="text-zinc-400">feature</p>
            </div>
        );
    }

    const handleThemeChange = async (theme: ThemeName) => {
        setLoading(true);
        console.log('Attempting to change theme to:', theme);

        try {
            const response = await fetch('/api/profile/theme', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme }),
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (data.success) {
                setSelectedTheme(theme);
                toast.success('✅ Theme updated! Reloading...');
                // Auto-reload page after 1 second
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                console.error('Theme update failed:', data.error);
                toast.error(data.error || 'Failed to update theme');
            }
        } catch (error) {
            console.error('Theme update error:', error);
            toast.error('Network error - failed to update theme');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-black/95 border-2 border-brand-green/40 p-6 rounded-3xl backdrop-blur-xl shadow-[0_20px_80px_-20px_rgba(74,222,128,0.5)]">
            <div className="mb-6">
                <h3 className="font-black text-white uppercase tracking-wider text-lg mb-2">
                    🎨 Theme Selector
                </h3>
                <p className="text-zinc-400 text-sm">
                    Choose your premium theme color
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {THEME_LIST.map((theme) => (
                    <button
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id)}
                        disabled={loading}
                        className={`relative p-6 rounded-2xl border-2 transition-all transform hover:-translate-y-1 hover:scale-[1.02] ${selectedTheme === theme.id
                            ? 'border-white/50 shadow-[0_0_30px_-5px_var(--glow)]'
                            : 'border-white/10 hover:border-white/30'
                            }`}
                        style={
                            {
                                '--glow': theme.glow,
                                background: `linear-gradient(135deg, ${theme.primary}15, ${theme.accent}10)`,
                            } as React.CSSProperties
                        }
                    >
                        {/* Color preview circle */}
                        <div
                            className="w-16 h-16 rounded-full mx-auto mb-3 shadow-lg"
                            style={{
                                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                                boxShadow: selectedTheme === theme.id ? `0 0 20px ${theme.glow}` : 'none',
                            }}
                        />

                        {/* Theme name */}
                        <p
                            className="font-black uppercase text-sm tracking-wide"
                            style={{ color: theme.primary }}
                        >
                            {theme.name}
                        </p>

                        {/* Selected indicator */}
                        {selectedTheme === theme.id && (
                            <div className="absolute top-2 right-2">
                                <span className="text-xl">✓</span>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {loading && (
                <div className="mt-4 text-center text-zinc-400 text-sm">
                    Saving theme...
                </div>
            )}
        </div>
    );
}
