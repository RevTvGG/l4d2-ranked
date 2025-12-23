// ELO Thresholds configuration
export const RANKS = [
    { name: "Global Elite", minElo: 2200, color: "text-red-500", bg: "bg-red-500/20", border: "border-red-500/30" },
    { name: "Supreme", minElo: 2000, color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30" },
    { name: "Legendary", minElo: 1800, color: "text-pink-400", bg: "bg-pink-500/20", border: "border-pink-500/30" },
    { name: "Diamond", minElo: 1600, color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30" },
    { name: "Platinum", minElo: 1400, color: "text-cyan-400", bg: "bg-cyan-500/20", border: "border-cyan-500/30" },
    { name: "Gold", minElo: 1200, color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30" },
    { name: "Silver", minElo: 1000, color: "text-slate-300", bg: "bg-slate-500/20", border: "border-slate-500/30" },
    { name: "Bronze", minElo: 0, color: "text-orange-700", bg: "bg-orange-900/20", border: "border-orange-700/30" },
];

export function getRankFromElo(elo: number) {
    return RANKS.find(r => elo >= r.minElo) || RANKS[RANKS.length - 1];
}

// STANDARD ELO LOGIC setup
export const BASE_K_FACTOR = 30; // Max points you can gain/lose in a balanced match

/**
 * Calculates the new rating for a player after a match.
 * @param currentRating The player's current ELO.
 * @param opponentRating The average ELO of the opposing team.
 * @param result 1 for Win, 0 for Loss, 0.5 for Draw.
 */
export function calculateNewRating(currentRating: number, opponentRating: number, result: number) {
    // Probability of winning based on rank difference
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));

    // Formula: NewRating = OldRating + K * (ActualScore - ExpectedScore)
    const change = Math.round(BASE_K_FACTOR * (result - expectedScore));

    return {
        newRating: currentRating + change,
        change: change
    };
}
