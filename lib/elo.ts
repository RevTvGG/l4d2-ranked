/**
 * ELO Rating System for L4D2 Ranked
 * Based on standard chess ELO with K-factor of 32
 */

const K_FACTOR = 32;

/**
 * Calculate expected score for a player/team
 * @param playerElo - Current ELO of player/team
 * @param opponentElo - Current ELO of opponent/team
 * @returns Expected score (0-1)
 */
export function calculateExpectedScore(playerElo: number, opponentElo: number): number {
    return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

/**
 * Calculate new ELO rating
 * @param currentElo - Current ELO rating
 * @param expectedScore - Expected score (0-1)
 * @param actualScore - Actual score (1 for win, 0 for loss)
 * @returns New ELO rating
 */
export function calculateNewElo(
    currentElo: number,
    expectedScore: number,
    actualScore: number
): number {
    const change = K_FACTOR * (actualScore - expectedScore);
    return Math.round(currentElo + change);
}

/**
 * Calculate ELO changes for a team-based match
 * @param teamAPlayers - Array of player ELOs for team A
 * @param teamBPlayers - Array of player ELOs for team B
 * @param winnerTeam - 'A' or 'B'
 * @returns Object with ELO changes for each team
 */
export function calculateTeamEloChanges(
    teamAPlayers: { steamId: string; currentElo: number }[],
    teamBPlayers: { steamId: string; currentElo: number }[],
    winnerTeam: 'A' | 'B'
) {
    // Calculate average ELO for each team
    const teamAAvgElo = teamAPlayers.reduce((sum, p) => sum + p.currentElo, 0) / teamAPlayers.length;
    const teamBAvgElo = teamBPlayers.reduce((sum, p) => sum + p.currentElo, 0) / teamBPlayers.length;

    // Calculate expected scores
    const teamAExpected = calculateExpectedScore(teamAAvgElo, teamBAvgElo);
    const teamBExpected = calculateExpectedScore(teamBAvgElo, teamAAvgElo);

    // Determine actual scores
    const teamAActual = winnerTeam === 'A' ? 1 : 0;
    const teamBActual = winnerTeam === 'B' ? 1 : 0;

    // Calculate changes for each player
    const teamAChanges = teamAPlayers.map((player) => {
        const newElo = calculateNewElo(player.currentElo, teamAExpected, teamAActual);
        return {
            steamId: player.steamId,
            oldElo: player.currentElo,
            newElo,
            change: newElo - player.currentElo
        };
    });

    const teamBChanges = teamBPlayers.map((player) => {
        const newElo = calculateNewElo(player.currentElo, teamBExpected, teamBActual);
        return {
            steamId: player.steamId,
            oldElo: player.currentElo,
            newElo,
            change: newElo - player.currentElo
        };
    });

    return {
        teamA: teamAChanges,
        teamB: teamBChanges,
        all: [...teamAChanges, ...teamBChanges]
    };
}

/**
 * Calculate MVP bonus (optional)
 * @param baseChange - Base ELO change
 * @returns ELO change with MVP bonus
 */
export function applyMvpBonus(baseChange: number): number {
    // MVP gets 20% bonus on their ELO gain (or 20% less loss)
    return Math.round(baseChange * 1.2);
}
