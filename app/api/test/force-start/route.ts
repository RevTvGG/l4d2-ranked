
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { matchId } = await request.json();

        if (!matchId) {
            return NextResponse.json({ error: 'Match ID required' }, { status: 400 });
        }

        await prisma.match.update({
            where: { id: matchId },
            data: { status: 'VETO' }
        });

        return NextResponse.json({ success: true, message: 'Match forced to VETO' });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
