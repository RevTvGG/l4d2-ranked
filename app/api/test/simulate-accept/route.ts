import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTestAuth } from '@/lib/testAuth';

export async function POST(request: NextRequest) {
    // Verificar autenticación
    const authError = requireTestAuth(request);
    if (authError) return authError;

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
