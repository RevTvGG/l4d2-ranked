// Premium Theme Configuration - EXPANDED VERSION
// 15 Premium Themes for maximum customization

export const THEMES = {
    // ===== CLASSIC GEMS =====
    emerald: {
        name: 'Emerald',
        primary: '#4ade80',
        accent: '#10b981',
        dark: '#059669',
        glow: 'rgba(74, 222, 128, 0.5)',
        category: 'gems',
    },
    sapphire: {
        name: 'Sapphire',
        primary: '#3b82f6',
        accent: '#2563eb',
        dark: '#1d4ed8',
        glow: 'rgba(59, 130, 246, 0.5)',
        category: 'gems',
    },
    amethyst: {
        name: 'Amethyst',
        primary: '#a855f7',
        accent: '#9333ea',
        dark: '#7e22ce',
        glow: 'rgba(168, 85, 247, 0.5)',
        category: 'gems',
    },
    ruby: {
        name: 'Ruby',
        primary: '#ef4444',
        accent: '#dc2626',
        dark: '#b91c1c',
        glow: 'rgba(239, 68, 68, 0.5)',
        category: 'gems',
    },
    gold: {
        name: 'Gold',
        primary: '#f59e0b',
        accent: '#d97706',
        dark: '#b45309',
        glow: 'rgba(245, 158, 11, 0.5)',
        category: 'gems',
    },
    cyan: {
        name: 'Cyan',
        primary: '#06b6d4',
        accent: '#0891b2',
        dark: '#0e7490',
        glow: 'rgba(6, 182, 212, 0.5)',
        category: 'gems',
    },

    // ===== NEON / GAMING =====
    neonPink: {
        name: 'Neon Pink',
        primary: '#ec4899',
        accent: '#db2777',
        dark: '#be185d',
        glow: 'rgba(236, 72, 153, 0.6)',
        category: 'neon',
    },
    neonLime: {
        name: 'Neon Lime',
        primary: '#84cc16',
        accent: '#65a30d',
        dark: '#4d7c0f',
        glow: 'rgba(132, 204, 22, 0.6)',
        category: 'neon',
    },
    electric: {
        name: 'Electric',
        primary: '#8b5cf6',
        accent: '#7c3aed',
        dark: '#6d28d9',
        glow: 'rgba(139, 92, 246, 0.6)',
        category: 'neon',
    },

    // ===== LEGENDARY =====
    diamond: {
        name: 'Diamond',
        primary: '#e0f2fe',
        accent: '#bae6fd',
        dark: '#7dd3fc',
        glow: 'rgba(224, 242, 254, 0.7)',
        category: 'legendary',
    },
    obsidian: {
        name: 'Obsidian',
        primary: '#a1a1aa',
        accent: '#71717a',
        dark: '#52525b',
        glow: 'rgba(161, 161, 170, 0.5)',
        category: 'legendary',
    },
    inferno: {
        name: 'Inferno',
        primary: '#f97316',
        accent: '#ea580c',
        dark: '#c2410c',
        glow: 'rgba(249, 115, 22, 0.6)',
        category: 'legendary',
    },

    // ===== EXCLUSIVE =====
    rainbow: {
        name: 'Rainbow',
        primary: '#f472b6',
        accent: '#818cf8',
        dark: '#34d399',
        glow: 'rgba(244, 114, 182, 0.5)',
        category: 'exclusive',
        isAnimated: true,
    },
    void: {
        name: 'Void',
        primary: '#1e1b4b',
        accent: '#312e81',
        dark: '#4c1d95',
        glow: 'rgba(30, 27, 75, 0.8)',
        category: 'exclusive',
    },
    plasma: {
        name: 'Plasma',
        primary: '#22d3ee',
        accent: '#a855f7',
        dark: '#ec4899',
        glow: 'rgba(34, 211, 238, 0.5)',
        category: 'exclusive',
        isAnimated: true,
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

// Grouped themes for better UI organization
export const THEME_CATEGORIES = {
    gems: { name: '💎 Classic Gems', themes: ['emerald', 'sapphire', 'amethyst', 'ruby', 'gold', 'cyan'] },
    neon: { name: '⚡ Neon Gaming', themes: ['neonPink', 'neonLime', 'electric'] },
    legendary: { name: '🔥 Legendary', themes: ['diamond', 'obsidian', 'inferno'] },
    exclusive: { name: '👑 Exclusive', themes: ['rainbow', 'void', 'plasma'] },
};
