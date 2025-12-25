
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const serverKey = 'ranked-server-k9cc0n0k4rc';

        const server = await prisma.gameServer.findUnique({
            where: { serverKey },
            include: {
                currentMatches: true
            }
        });

        const allMatches = await prisma.match.findMany({
            where: { status: 'READY' },
            select: { id: true, serverId: true, status: true, mapName: true }
        });

        return NextResponse.json({
            server,
            allReadyMatches: allMatches
        });

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
