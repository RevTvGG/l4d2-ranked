'use client';

import { getThemeColors } from '@/lib/themes';
import { PREMIUM_FONTS, getPremiumIcon } from '@/lib/premium';

interface PremiumUsernameProps {
    username: string;
    isPremium?: boolean;
    profileTheme?: string;
    nameGradient?: string | null;
    customFont?: string | null;
    premiumIcon?: string | null;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
    showBadge?: boolean;
    showGlow?: boolean;
    className?: string;
}

export function PremiumUsername({
    username,
    isPremium = false,
    profileTheme = 'emerald',
    nameGradient,
    customFont,
    premiumIcon,
    size = 'md',
    showBadge = true,
    showGlow = true,
    className = '',
}: PremiumUsernameProps) {
    const themeColors = getThemeColors(profileTheme);
    const iconData = getPremiumIcon(premiumIcon);

    // Size classes
    const sizeClasses: Record<string, string> = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-xl',
        xl: 'text-3xl',
        '2xl': 'text-4xl',
        '4xl': 'text-4xl md:text-5xl lg:text-6xl', // Hero size
    };

    // Font class from customFont
    const fontClass = PREMIUM_FONTS.find(f => f.id === customFont)?.class || 'font-sans';

    // If not premium, just render normal username
    if (!isPremium) {
        return (
            <span className={`${sizeClasses[size] || ''} font-bold text-white ${className}`}>
                {username}
            </span>
        );
    }

    // Find gradient preset
    const hasGradient = !!nameGradient;

    return (
        <span className={`inline-flex items-center gap-1.5 group relative ${className}`}>
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

            {/* Premium badge - customizable icon */}
            {showBadge && (
                <span
                    className={`relative ${iconData.color} animate-pulse drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]`}
                    title="Premium Member"
                >
                    {iconData.icon}
                </span>
            )}

            {/* Username with effects */}
            <span
                className={`
                    relative ${sizeClasses[size] || sizeClasses['md']} font-black ${fontClass} tracking-wide
                    ${hasGradient
                        ? `bg-gradient-to-r ${nameGradient} bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]`
                        : ''
                    }
                    hover:scale-105 transition-transform duration-300
                `}
                style={hasGradient ? {
                    filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4)) drop-shadow(0 0 20px rgba(255,255,255,0.2))',
                } : {
                    color: themeColors.primary,
                    textShadow: `0 0 20px ${themeColors.glow}, 0 0 40px ${themeColors.glow}`,
                }}
            >
                {username}
            </span>
        </span>
    );
}

export default PremiumUsername;

