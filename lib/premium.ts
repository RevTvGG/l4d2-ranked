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
    { id: 'blood', name: 'Blood', class: 'from-red-900 via-red-600 to-red-400' },
    { id: 'ocean-blue', name: 'Ocean Blue', class: 'from-blue-900 via-blue-600 to-cyan-400' },
    { id: 'toxic', name: 'Toxic', class: 'from-lime-300 via-green-400 to-emerald-500' },
    { id: 'galaxy', name: 'Galaxy', class: 'from-purple-900 via-pink-600 to-indigo-400' },
    { id: 'chrome', name: 'Chrome', class: 'from-zinc-200 via-zinc-400 to-zinc-600' },
    { id: 'aurora', name: 'Aurora', class: 'from-green-400 via-cyan-400 to-purple-500' },
];

// Helper function to get premium icon
export function getPremiumIcon(iconId?: string | null) {
    return PREMIUM_ICONS.find(i => i.id === iconId) || PREMIUM_ICONS[0]; // default to star
}
