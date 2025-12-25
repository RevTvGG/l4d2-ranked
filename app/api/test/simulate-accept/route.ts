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

        // Simulate all players accepting by moving match to VETO status
        await prisma.match.update({
            where: { id: match.id },
            data: { status: 'VETO' }
        });

        return NextResponse.json({
            success: true,
            playersAccepted: match.players.length,
            matchStatus: 'VETO'
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
