import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTestAuth } from '@/lib/testAuth';

export async function POST(request: NextRequest) {
    // Verificar autenticación
    const authError = requireTestAuth(request);
    if (authError) return authError;

    try {
        // Get latest READY match
        const match = await prisma.match.findFirst({
            where: {
                status: 'READY'
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!match) {
            return NextResponse.json({
                success: false,
                error: 'No match in READY status found'
            }, { status: 404 });
        }

        // Call the start-match endpoint
        const startResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/server/start-match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchId: match.id })
        });

        const startData = await startResponse.json();

        if (!startData.success) {
            return NextResponse.json({
                success: false,
                error: startData.error || 'Failed to start match'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            map: match.selectedMap,
            server: `${match.serverIp}:${match.serverPort}`,
            matchId: match.id
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
