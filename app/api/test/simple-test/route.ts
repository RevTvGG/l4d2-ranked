import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * SIMPLE TEST MODE: Clean queue, add 7 bots + current user, create match
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        console.log('[SIMPLE TEST] Starting...');

        // 1. Clean ALL queue entries
        await prisma.queueEntry.deleteMany({});
        console.log('[SIMPLE TEST] Cleared queue');

        // 2. Create/get 7 bots
        const bots = [];
        for (let i = 1; i <= 7; i++) {
            const bot = await prisma.user.upsert({
                where: { steamId: `FAKE_BOT_${i}` },
                update: {},
                create: {
                    steamId: `FAKE_BOT_${i}`,
                    name: `Bot ${i}`,
                    email: `bot${i}@test.com`,
                    rating: 1000
                }
            });
            bots.push(bot);
        }

        // 3. Add bots to queue
        for (const bot of bots) {
            await prisma.queueEntry.create({
                data: {
                    userId: bot.id,
                    mmr: bot.rating,
                    status: 'WAITING',
                    isReady: false,
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000)
                }
            });
        }

        // 4. Add current user to queue
        await prisma.queueEntry.create({
            data: {
                userId: session.user.id,
                mmr: session.user.rating || 1000,
                status: 'WAITING',
                isReady: false,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000)
            }
        });

        console.log('[SIMPLE TEST] Added 8 players to queue');

        // 5. Trigger matchmaking
        const { checkQueueAndCreateMatch } = require('@/app/actions/queue');
        const result = await checkQueueAndCreateMatch();

        console.log('[SIMPLE TEST] Matchmaking result:', result);

        return NextResponse.json({
            success: true,
            message: 'Test match created!',
            players: 8
        });

    } catch (error) {
        console.error('[SIMPLE TEST] Error:', error);
        return NextResponse.json(
            { error: 'Failed', details: String(error) },
            { status: 500 }
        );
    }
}
