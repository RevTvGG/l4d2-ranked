import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Match Report Endpoint
 * Called by SourceMod plugin when match ends
 * Receives final scores and updates database
 */
export async function POST(request: NextRequest) {
    try {
        const { matchId, teamAScore, teamBScore, winner } = await request.json();

        if (!matchId || teamAScore === undefined || teamBScore === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get match with players
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                players: { include: { user: true } },
            },
        });

        if (!match) {
            return NextResponse.json(
                { error: 'Match not found' },
                { status: 404 }
            );
        }

        // Update match with results
        await prisma.match.update({
            where: { id: matchId },
            data: {
                status: 'COMPLETED',
                teamAScore,
                teamBScore,
                winnerTeam: winner,
                completedAt: new Date(),
            },
        });

        // Calculate ELO changes
        const K = 32; // ELO K-factor
        const eloChanges = [];

        for (const player of match.players) {
            // Determine actual score based on result
            let actualScore: number;
            if (winner === 'TIE') {
                actualScore = 0.5; // Tie = half point
            } else {
                actualScore = player.team === winner ? 1 : 0;
            }

            // Find average opponent ELO
            const opponents = match.players.filter((p) => p.team !== player.team);
            const avgOpponentElo = opponents.reduce((sum, p) => sum + p.user.rating, 0) / opponents.length;

            // Calculate expected score
            const expectedScore = 1 / (1 + Math.pow(10, (avgOpponentElo - player.user.rating) / 400));

            // Calculate ELO change
            const change = Math.round(K * (actualScore - expectedScore));

            eloChanges.push({
                userId: player.userId,
                won: actualScore === 1,
                tied: actualScore === 0.5,
                oldRating: player.user.rating,
                newRating: player.user.rating + change,
                change,
            });

            // Update player rating
            await prisma.user.update({
                where: { id: player.userId },
                data: {
                    rating: { increment: change },
                    wins: actualScore === 1 ? { increment: 1 } : undefined,
                    losses: actualScore === 0 ? { increment: 1 } : undefined,
                },
            });
        }

        console.log(`[Match Report] Match ${matchId} completed`);
        console.log(`  Score: Team A ${teamAScore} - ${teamBScore} Team B`);
        console.log(`  Winner: ${winner}`);
        console.log(`  ELO changes:`, eloChanges);

        return NextResponse.json({
            success: true,
            matchId,
            winner,
            eloChanges,
        });
    } catch (error) {
        console.error('[Match Report] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
