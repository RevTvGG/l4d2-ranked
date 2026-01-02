export const PREMIUM_ICONS = [
    { id: 'star', name: 'Star', icon: '⭐', color: 'text-yellow-400' },
    { id: 'crown', name: 'Crown', icon: '👑', color: 'text-yellow-500' },
    { id: 'diamond', name: 'Diamond', icon: '💎', color: 'text-cyan-400' },
    { id: 'fire', name: 'Fire', icon: '🔥', color: 'text-orange-500' },
    { id: 'bolt', name: 'Bolt', icon: '⚡', color: 'text-yellow-300' },
    { id: 'skull', name: 'Skull', icon: '💀', color: 'text-zinc-300' },
    { id: 'rocket', name: 'Rocket', icon: '🚀', color: 'text-blue-400' },
    { id: 'heart', name: 'Heart', icon: '💜', color: 'text-purple-400' },
    { id: 'gem', name: 'Gem', icon: '💠', color: 'text-teal-400' },
    { id: 'verified', name: 'Verified', icon: '✅', color: 'text-green-400' },
];

export const PREMIUM_FONTS = [
    { id: 'default', name: 'Default', class: 'font-sans' },
    { id: 'gaming', name: 'Gaming', class: 'font-gaming' },
    { id: 'elegant', name: 'Elegant', class: 'font-elegant' },
    { id: 'modern', name: 'Modern', class: 'font-modern' },
    { id: 'futuristic', name: 'Futuristic', class: 'font-futuristic' },
    { id: 'pixel', name: 'Pixel', class: 'font-pixel' },
    { id: 'retro', name: 'Retro', class: 'font-retro' },
    { id: 'script', name: 'Script', class: 'font-script' },
    { id: 'bold', name: 'Bold', class: 'font-extrabold' },
    { id: 'mono', name: 'Mono', class: 'font-mono' },
];

// Gradient presets with CSS gradient values for inline styles
export const GRADIENT_PRESETS = [
    { id: 'cotton-candy', name: 'Cotton Candy', css: 'linear-gradient(90deg, #f472b6, #a78bfa, #818cf8)' },
    { id: 'sunset', name: 'Sunset', css: 'linear-gradient(90deg, #fb923c, #f87171, #facc15)' },
    { id: 'northern-lights', name: 'Northern Lights', css: 'linear-gradient(90deg, #5eead4, #60a5fa, #c084fc)' },
    { id: 'cyberpunk', name: 'Cyberpunk', css: 'linear-gradient(90deg, #fde047, #f472b6, #22d3ee)' },
    { id: 'biohazard', name: 'Biohazard', css: 'linear-gradient(90deg, #bef264, #4ade80, #34d399)' },
    { id: 'fire', name: 'Fire', css: 'linear-gradient(90deg, #fde047, #fb923c, #ef4444)' },
    { id: 'ice', name: 'Ice', css: 'linear-gradient(90deg, #a5f3fc, #93c5fd, #818cf8)' },
    { id: 'gold', name: 'Gold', css: 'linear-gradient(90deg, #fef08a, #fcd34d, #fb923c)' },
    { id: 'rainbow', name: 'Rainbow', css: 'linear-gradient(90deg, #f87171, #facc15, #4ade80, #60a5fa, #a78bfa)' },
    { id: 'blood', name: 'Blood', css: 'linear-gradient(90deg, #f87171, #ef4444, #e11d48)' },
    { id: 'ocean-blue', name: 'Ocean Blue', css: 'linear-gradient(90deg, #93c5fd, #60a5fa, #67e8f9)' },
    { id: 'toxic', name: 'Toxic', css: 'linear-gradient(90deg, #bef264, #86efac, #34d399)' },
    { id: 'galaxy', name: 'Galaxy', css: 'linear-gradient(90deg, #c084fc, #f472b6, #818cf8)' },
    { id: 'chrome', name: 'Chrome', css: 'linear-gradient(90deg, #f4f4f5, #d4d4d8, #a1a1aa)' },
    { id: 'aurora', name: 'Aurora', css: 'linear-gradient(90deg, #86efac, #67e8f9, #c084fc)' },
];

// Helper function to get premium icon
export function getPremiumIcon(iconId?: string | null) {
    return PREMIUM_ICONS.find(i => i.id === iconId) || PREMIUM_ICONS[0]; // default to star
}

// Helper function to get gradient by ID or CSS value
export function getGradientStyle(gradientValue?: string | null): React.CSSProperties | undefined {
    if (!gradientValue) return undefined;

    // Check if it's a direct CSS gradient
    if (gradientValue.startsWith('linear-gradient')) {
        return {
            background: gradientValue,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
        };
    }

    // Check if it's an ID
    const preset = GRADIENT_PRESETS.find(g => g.id === gradientValue);
    if (preset) {
        return {
            background: preset.css,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
        };
    }

    // Check if it's a CSS value stored directly
    const presetByCss = GRADIENT_PRESETS.find(g => g.css === gradientValue);
    if (presetByCss) {
        return {
            background: presetByCss.css,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
        };
    }

    return undefined;
}
