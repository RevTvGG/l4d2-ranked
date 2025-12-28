import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Calculate new ELO rating
 */
function calculateElo(
    playerRating: number,
    opponentAvgRating: number,
    didWin: boolean,
    kFactor: number = 32
): number {
    // Expected score (probability of winning)
    const expectedScore = 1 / (1 + Math.pow(10, (opponentAvgRating - playerRating) / 400));

    // Actual score (1 if won, 0 if lost)
    const actualScore = didWin ? 1 : 0;

    // Calculate new rating
    const newRating = playerRating + kFactor * (actualScore - expectedScore);

    return Math.round(newRating);
}

export async function POST(request: NextRequest) {
    try {
        let matchId: string | undefined;

        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            const json = await request.json();
            matchId = json.matchId;
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            // Parse URL-encoded form data from SourceMod
            const body = await request.text();
            const params = new URLSearchParams(body);
            matchId = params.get('matchId') || undefined;
        } else {
            // Try FormData as fallback
            const formData = await request.formData();
            matchId = formData.get('matchId')?.toString();
        }

        console.log('[API] Match complete request - matchId:', matchId, 'content-type:', contentType);

        if (!matchId) {
            return NextResponse.json(
                { error: 'matchId is required' },
                { status: 400 }
            );
        }

        // Get match with all data
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                players: { include: { user: true } },
                rounds: { orderBy: { roundNumber: 'asc' } },
            },
        });

        if (!match) {
            return NextResponse.json(
                { error: 'Match not found' },
                { status: 404 }
            );
        }

        if (match.status === 'COMPLETED') {
            return NextResponse.json(
                { error: 'Match already completed' },
                { status: 400 }
            );
        }

        // Calculate total scores for each team
        let teamAScore = 0;
        let teamBScore = 0;

        for (const round of match.rounds as any[]) {
            // Odd rounds (1, 3, 5...) are Team A as survivors
            // Even rounds (2, 4, 6...) are Team B as survivors
            if (round.roundNumber % 2 === 1) {
                teamAScore += (round as any).teamScore || 0;
            } else {
                teamBScore += (round as any).teamScore || 0;
            }
        }

        // Determine winner
        const winner = teamAScore > teamBScore ? 'TEAM_A' :
            teamBScore > teamAScore ? 'TEAM_B' : 'TIE';

        console.log(`[Match Complete] Match ${matchId} - Team A: ${teamAScore}, Team B: ${teamBScore}, Winner: ${winner}`);

        // Get players by team
        const teamAPlayers = match.players.filter(p => p.team === 'TEAM_A');
        const teamBPlayers = match.players.filter(p => p.team === 'TEAM_B');

        // Calculate average ELO for each team (using ELO at start)
        const teamAAvgElo = teamAPlayers.reduce((sum, p) => sum + ((p as any).eloAtStart || p.user.rating), 0) / teamAPlayers.length;
        const teamBAvgElo = teamBPlayers.reduce((sum, p) => sum + ((p as any).eloAtStart || p.user.rating), 0) / teamBPlayers.length;

        console.log(`[Match Complete] Team A Avg ELO: ${Math.round(teamAAvgElo)}, Team B Avg ELO: ${Math.round(teamBAvgElo)}`);

        // Update ELO for each player
        for (const matchPlayer of match.players) {
            const isTeamA = matchPlayer.team === 'TEAM_A';
            const didWin = (isTeamA && winner === 'TEAM_A') || (!isTeamA && winner === 'TEAM_B');
            const opponentAvgElo = isTeamA ? teamBAvgElo : teamAAvgElo;

            // Use ELO at start if available, otherwise use current rating
            const startElo = (matchPlayer as any).eloAtStart || matchPlayer.user.rating;

            // Calculate new ELO
            const newElo = calculateElo(startElo, opponentAvgElo, didWin);
            const eloChange = newElo - startElo;

            // Update MatchPlayer with ELO results
            await prisma.matchPlayer.update({
                where: { id: matchPlayer.id },
                data: {
                    eloAtEnd: newElo,
                    eloChange: eloChange,
                } as any,
            });

            // Update User's current rating
            await prisma.user.update({
                where: { id: matchPlayer.userId },
                data: {
                    rating: newElo,
                    // Update win/loss count
                    wins: didWin ? { increment: 1 } : undefined,
                    losses: !didWin && winner !== 'TIE' ? { increment: 1 } : undefined,
                },
            });

            console.log(`[ELO Update] ${matchPlayer.user.name}: ${startElo} → ${newElo} (${eloChange >= 0 ? '+' : ''}${eloChange})`);
        }

        // Update match as completed
        await prisma.match.update({
            where: { id: matchId },
            data: {
                status: 'COMPLETED',
                winnerTeam: winner,
                teamAScore: teamAScore,
                teamBScore: teamBScore,
                completedAt: new Date(),
            },
        });

        // Calculate win rates for all players
        for (const matchPlayer of match.players) {
            const user = await prisma.user.findUnique({
                where: { id: matchPlayer.userId },
            });

            if (user) {
                const totalGames = user.wins + user.losses;
                const winRate = totalGames > 0 ? (user.wins / totalGames) * 100 : 0;

                await prisma.user.update({
                    where: { id: user.id },
                    data: { winRate },
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Match completed successfully',
            winner,
            teamAScore,
            teamBScore,
        });
    } catch (error) {
        console.error('[API] Error in match complete:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
