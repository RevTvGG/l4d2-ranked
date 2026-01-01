
export interface Rank {
    name: string;
    minElo: number;
    imagePath: string;
    color: string;
}

export const RANKS: Rank[] = [
    { name: 'Global Elite', minElo: 2200, imagePath: '/ranks/global_elite.png', color: '#FFD700' }, // Gold/Yellow
    { name: 'Supreme', minElo: 2000, imagePath: '/ranks/supreme.png', color: '#FFA500' }, // Orange/Gold
    { name: 'Legendary', minElo: 1800, imagePath: '/ranks/legendary.png', color: '#9d4dbb' }, // Purple
    { name: 'Diamond', minElo: 1600, imagePath: '/ranks/diamond.png', color: '#00BFFF' }, // Deep Sky Blue
    { name: 'Platinum', minElo: 1400, imagePath: '/ranks/platinum.png', color: '#E5E4E2' }, // Platinum
    { name: 'Gold', minElo: 1200, imagePath: '/ranks/gold.png', color: '#FFD700' }, // Gold
    { name: 'Silver', minElo: 1000, imagePath: '/ranks/silver.png', color: '#C0C0C0' }, // Silver
    { name: 'Bronze', minElo: 0, imagePath: '/ranks/bronze.png', color: '#CD7F32' }, // Bronze
];

export function getRankForElo(elo: number): Rank {
    // Ranks are ordered from highest to lowest minElo
    for (const rank of RANKS) {
        if (elo >= rank.minElo) {
            return rank;
        }
    }
    return RANKS[RANKS.length - 1]; // Fallback to lowest rank (Bronze)
}
