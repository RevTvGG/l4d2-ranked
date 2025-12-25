import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
    try {
        // Get latest match
        const match = await prisma.match.findFirst({
            where: {
                status: 'READY_CHECK'
            },
            orderBy: { createdAt: 'desc' },
            include: {
                players: true
            }
        });

        if (!match) {
            return NextResponse.json({
                success: false,
                error: 'No match in READY_CHECK status found'
            }, { status: 404 });
        }

        // Mark all players as accepted
        const { acceptMatch } = await import('@/app/actions/match');

        for (const player of match.players) {
            // Simulate each player accepting
            await prisma.matchPlayer.update({
                where: {
                    matchId_userId: {
                        matchId: match.id,
                        userId: player.userId
                    }
                },
                data: {
                    accepted: true
                }
            });
        }

        // Check if all accepted and update match status
        const allAccepted = await prisma.matchPlayer.count({
            where: {
                matchId: match.id,
                accepted: true
            }
        });

        if (allAccepted === match.players.length) {
            await prisma.match.update({
                where: { id: match.id },
                data: { status: 'VETO' }
            });
        }

        return NextResponse.json({
            success: true,
            playersAccepted: allAccepted,
            matchStatus: 'VETO'
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
