import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        let matchId: string | undefined;

        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const json = await request.json();
            matchId = json.matchId;
        } else {
            const formData = await request.formData();
            matchId = formData.get('matchId')?.toString();
        }

        if (!matchId) {
            return NextResponse.json(
                { error: 'matchId is required' },
                { status: 400 }
            );
        }

        // Find the match
        const match = await prisma.match.findUnique({
            where: { id: matchId },
        });

        if (!match) {
            return NextResponse.json(
                { error: 'Match not found' },
                { status: 404 }
            );
        }

        // Update match status to IN_PROGRESS
        await prisma.match.update({
            where: { id: matchId },
            data: {
                status: 'IN_PROGRESS',
                startedAt: new Date(),
            },
        });

        console.log(`[Match Live] Match ${matchId} is now IN_PROGRESS`);

        return NextResponse.json({
            success: true,
            message: 'Match status updated to IN_PROGRESS',
        });
    } catch (error) {
        console.error('[API] Error in notify-live:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
