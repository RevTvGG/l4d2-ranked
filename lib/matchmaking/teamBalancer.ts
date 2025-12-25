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
 * Balance 8 players into two teams of 4 based on ELO rating
 * Uses snake draft: A gets #1, B gets #2 and #3, A gets #4 and #5, etc.
 * 
 * @param players - Array of exactly 8 players
 * @returns Balanced teams with ELO statistics
 */
export function balanceTeams(players: Player[]): BalancedTeams {
    if (players.length !== 8) {
        throw new Error('Exactly 8 players required for team balancing');
    }

    // Sort by ELO descending (highest first)
    const sorted = [...players].sort((a, b) => b.rating - a.rating);

    // Snake draft pattern
    const teamA: Player[] = [];
    const teamB: Player[] = [];

    // Round 1: A gets #1, B gets #2
    teamA.push(sorted[0]);
    teamB.push(sorted[1]);

    // Round 2: B gets #3, A gets #4
    teamB.push(sorted[2]);
    teamA.push(sorted[3]);

    // Round 3: A gets #5, B gets #6
    teamA.push(sorted[4]);
    teamB.push(sorted[5]);

    // Round 4: B gets #7, A gets #8
    teamB.push(sorted[6]);
    teamA.push(sorted[7]);

    // Calculate average ELO for each team
    const avgEloA = teamA.reduce((sum, p) => sum + p.rating, 0) / 4;
    const avgEloB = teamB.reduce((sum, p) => sum + p.rating, 0) / 4;
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
