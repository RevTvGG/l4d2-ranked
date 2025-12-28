// Team Balancing Algorithm
// Uses "Snake Draft" pattern to distribute players evenly by ELO

export interface Player {
    id: string;
    name: string;
    rating: number;
    steamId?: string;
}

export interface BalancedTeams {
    teamA: Player[];
    teamB: Player[];
    avgEloA: number;
    avgEloB: number;
    eloDifference: number;
}

/**
 * Balance players into two teams based on ELO rating
 * Uses snake draft: A gets #1, B gets #2 and #3, A gets #4 and #5, etc.
 * 
 * @param players - Array of 2-8 players
 * @returns Balanced teams with ELO statistics
 */
export function balanceTeams(players: Player[]): BalancedTeams {
    if (players.length < 2) {
        throw new Error('At least 2 players required for team balancing');
    }
    if (players.length > 8) {
        throw new Error('Maximum 8 players allowed for team balancing');
    }

    // Sort by ELO descending (highest first)
    const sorted = [...players].sort((a, b) => b.rating - a.rating);

    // Snake draft pattern
    const teamA: Player[] = [];
    const teamB: Player[] = [];

    // Distribute players using snake draft
    for (let i = 0; i < sorted.length; i++) {
        const round = Math.floor(i / 2);
        const isEvenRound = round % 2 === 0;

        if (i % 2 === 0) {
            // First pick of the round
            if (isEvenRound) {
                teamA.push(sorted[i]);
            } else {
                teamB.push(sorted[i]);
            }
        } else {
            // Second pick of the round
            if (isEvenRound) {
                teamB.push(sorted[i]);
            } else {
                teamA.push(sorted[i]);
            }
        }
    }

    // Calculate average ELO for each team
    const avgEloA = teamA.length > 0 ? teamA.reduce((sum, p) => sum + p.rating, 0) / teamA.length : 0;
    const avgEloB = teamB.length > 0 ? teamB.reduce((sum, p) => sum + p.rating, 0) / teamB.length : 0;
    const eloDifference = Math.abs(avgEloA - avgEloB);

    return {
        teamA,
        teamB,
        avgEloA: Math.round(avgEloA),
        avgEloB: Math.round(avgEloB),
        eloDifference: Math.round(eloDifference),
    };
}

/**
 * Example usage:
 * 
 * const players = [
 *   { id: '1', name: 'Player A', rating: 1500 },
 *   { id: '2', name: 'Player B', rating: 1400 },
 *   { id: '3', name: 'Player C', rating: 1300 },
 *   { id: '4', name: 'Player D', rating: 1200 },
 *   { id: '5', name: 'Player E', rating: 1100 },
 *   { id: '6', name: 'Player F', rating: 1000 },
 *   { id: '7', name: 'Player G', rating: 900 },
 *   { id: '8', name: 'Player H', rating: 800 },
 * ];
 * 
 * const result = balanceTeams(players);
 * // Team A: [A(1500), D(1200), E(1100), H(800)] = Avg 1150
 * // Team B: [B(1400), C(1300), F(1000), G(900)] = Avg 1150
 * // Difference: 0 (perfect balance!)
 */
