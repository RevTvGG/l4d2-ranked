// Theme configuration for premium users
export const THEMES = {
    emerald: {
        name: 'Emerald',
        primary: '#4ade80',
        accent: '#10b981',
        dark: '#059669',
        glow: 'rgba(74, 222, 128, 0.5)',
    },
    sapphire: {
        name: 'Sapphire',
        primary: '#3b82f6',
        accent: '#2563eb',
        dark: '#1d4ed8',
        glow: 'rgba(59, 130, 246, 0.5)',
    },
    amethyst: {
        name: 'Amethyst',
        primary: '#a855f7',
        accent: '#9333ea',
        dark: '#7e22ce',
        glow: 'rgba(168, 85, 247, 0.5)',
    },
    ruby: {
        name: 'Ruby',
        primary: '#ef4444',
        accent: '#dc2626',
        dark: '#b91c1c',
        glow: 'rgba(239, 68, 68, 0.5)',
    },
    gold: {
        name: 'Gold',
        primary: '#f59e0b',
        accent: '#d97706',
        dark: '#b45309',
        glow: 'rgba(245, 158, 11, 0.5)',
    },
    cyan: {
        name: 'Cyan',
        primary: '#06b6d4',
        accent: '#0891b2',
        dark: '#0e7490',
        glow: 'rgba(6, 182, 212, 0.5)',
    },
} as const;

export type ThemeName = keyof typeof THEMES;

export function getThemeColors(theme?: string | null) {
    const themeName = (theme as ThemeName) || 'emerald';
    return THEMES[themeName] || THEMES.emerald;
}

export function isValidTheme(theme: string): theme is ThemeName {
    return theme in THEMES;
}

export const THEME_LIST = Object.entries(THEMES).map(([key, value]) => ({
    id: key as ThemeName,
    ...value,
}));
