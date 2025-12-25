import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MAPS = ['Dark Carnival', 'Dead Center', 'The Parish', 'No Mercy'];

export async function POST() {
    try {
        // Get latest match in VETO status
        const match = await prisma.match.findFirst({
            where: {
                status: 'VETO'
            },
            orderBy: { createdAt: 'desc' },
            include: {
                players: true
            }
        });

        if (!match) {
            return NextResponse.json({
                success: false,
                error: 'No match in VETO status found'
            }, { status: 404 });
        }

        // Simulate voting - each player votes for a random map
        for (const player of match.players) {
            const randomMap = MAPS[Math.floor(Math.random() * MAPS.length)];

            await prisma.mapVote.upsert({
                where: {
                    matchId_userId: {
                        matchId: match.id,
                        userId: player.userId
                    }
                },
                update: {
                    map: randomMap
                },
                create: {
                    matchId: match.id,
                    userId: player.userId,
                    map: randomMap
                }
            });
        }

        // Count votes and select winner
        const votes = await prisma.mapVote.groupBy({
            by: ['map'],
            where: { matchId: match.id },
            _count: true
        });

        const winningMap = votes.reduce((prev, current) =>
            current._count > prev._count ? current : prev
        ).map;

        // Update match with selected map
        await prisma.match.update({
            where: { id: match.id },
            data: {
                selectedMap: winningMap,
                status: 'READY'
            }
        });

        return NextResponse.json({
            success: true,
            selectedMap: winningMap,
            matchStatus: 'READY',
            votes: votes
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
