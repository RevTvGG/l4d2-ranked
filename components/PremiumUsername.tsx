'use client';

import { getThemeColors } from '@/lib/themes';

interface PremiumUsernameProps {
    username: string;
    isPremium?: boolean;
    profileTheme?: string;
    nameGradient?: string | null;
    customFont?: string | null;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showBadge?: boolean;
    showGlow?: boolean;
}

// Premium fonts available for selection
export const PREMIUM_FONTS = [
    { id: 'default', name: 'Default', class: 'font-sans' },
    { id: 'gaming', name: 'Gaming', class: 'font-gaming' },
    { id: 'elegant', name: 'Elegant', class: 'font-elegant' },
    { id: 'modern', name: 'Modern', class: 'font-modern' },
    { id: 'futuristic', name: 'Futuristic', class: 'font-futuristic' },
    { id: 'pixel', name: 'Pixel', class: 'font-pixel' },
];

// Premium gradient presets
export const GRADIENT_PRESETS = [
    { id: 'cotton-candy', name: 'Cotton Candy', class: 'from-pink-500 via-purple-500 to-indigo-500' },
    { id: 'sunset', name: 'Sunset', class: 'from-orange-500 via-red-500 to-yellow-500' },
    { id: 'northern-lights', name: 'Northern Lights', class: 'from-teal-400 via-blue-500 to-purple-600' },
    { id: 'cyberpunk', name: 'Cyberpunk', class: 'from-yellow-400 via-pink-500 to-cyan-500' },
    { id: 'biohazard', name: 'Biohazard', class: 'from-lime-400 via-green-500 to-emerald-600' },
    { id: 'fire', name: 'Fire', class: 'from-yellow-500 via-orange-500 to-red-600' },
    { id: 'ice', name: 'Ice', class: 'from-cyan-300 via-blue-400 to-indigo-500' },
    { id: 'gold', name: 'Gold', class: 'from-yellow-200 via-yellow-400 to-amber-500' },
    { id: 'rainbow', name: 'Rainbow', class: 'from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500' },
];

export function PremiumUsername({
    username,
    isPremium = false,
    profileTheme = 'emerald',
    nameGradient,
    customFont,
    size = 'md',
    showBadge = true,
    showGlow = true,
}: PremiumUsernameProps) {
    const themeColors = getThemeColors(profileTheme);

    // Size classes
    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-xl',
        xl: 'text-3xl',
    };

    // Font class from customFont
    const fontClass = PREMIUM_FONTS.find(f => f.id === customFont)?.class || 'font-sans';

    // If not premium, just render normal username
    if (!isPremium) {
        return (
            <span className={`${sizeClasses[size]} font-bold text-white`}>
                {username}
            </span>
        );
    }

    // Find gradient preset
    const gradientPreset = GRADIENT_PRESETS.find(g => g.class === nameGradient);
    const hasGradient = !!nameGradient;

    return (
        <span className="inline-flex items-center gap-1.5 group relative">
            {/* Glow effect behind name */}
            {showGlow && (
                <span
                    className="absolute inset-0 blur-lg opacity-50 group-hover:opacity-80 transition-opacity duration-500"
                    style={{
                        background: hasGradient
                            ? 'linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6)'
                            : themeColors.primary,
                    }}
                />
            )}

            {/* Premium badge */}
            {showBadge && (
                <span
                    className="relative text-yellow-400 animate-pulse drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]"
                    title="Premium Member"
                >
                    ⭐
                </span>
            )}

            {/* Username with effects */}
            <span
                className={`
                    relative ${sizeClasses[size]} font-black ${fontClass} tracking-wide
                    ${hasGradient
                        ? `bg-gradient-to-r ${nameGradient} bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]`
                        : ''
                    }
                    drop-shadow-[0_0_10px_currentColor]
                    hover:scale-105 transition-transform duration-300
                `}
                style={!hasGradient ? {
                    color: themeColors.primary,
                    textShadow: `0 0 20px ${themeColors.glow}, 0 0 40px ${themeColors.glow}`,
                } : {}}
            >
                {username}
            </span>
        </span>
    );
}

// Default export for easier imports
export default PremiumUsername;
