import { NextRequest, NextResponse } from 'next/server';
import { checkQueueAndCreateMatch } from '@/app/actions/queue';

/**
 * Manual trigger for matchmaking
 * Call this endpoint to force check queue and create match
 */
export async function POST(request: NextRequest) {
    try {
        console.log('[MANUAL MATCHMAKING] Triggering queue check...');

        await checkQueueAndCreateMatch();

        return NextResponse.json({
            success: true,
            message: 'Matchmaking triggered successfully'
        });
    } catch (error) {
        console.error('[MANUAL MATCHMAKING] Error:', error);
        return NextResponse.json(
            { error: 'Failed to trigger matchmaking', details: String(error) },
            { status: 500 }
        );
    }
}
