
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { matchId } = await request.json();

        if (!matchId) {
            return NextResponse.json({ error: 'Match ID required' }, { status: 400 });
        }

        // Force set map and status
        await prisma.match.update({
            where: { id: matchId },
            data: {
                status: 'READY',
                mapName: 'Dark Carnival', // Default fallback
                selectedMap: 'Dark Carnival'
            }
        });

        return NextResponse.json({ success: true, message: 'Map forced to Dark Carnival' });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
