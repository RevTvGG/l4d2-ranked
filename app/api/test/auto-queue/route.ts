import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * TEST MODE: Auto-fill queue with fake players
 * This endpoint creates 6 fake players and adds them to queue
 * along with the current user, triggering an instant match
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

        console.log('[TEST MODE] Starting auto-fill queue...');

        // 1. Create 7 fake players (so 1 real user + 7 bots = 8 players)
        const fakePlayers = [];
        for (let i = 1; i <= 7; i++) {
            const fakeUser = await prisma.user.upsert({
                where: { steamId: `FAKE_BOT_${i}` },
                update: {},
                create: {
                    steamId: `FAKE_BOT_${i}`,
                    name: `Bot ${i}`,
                    email: `bot${i}@test.com`,
                    rating: 1000
                }
            });
            fakePlayers.push(fakeUser);
        }

        console.log(`[TEST MODE] Created ${fakePlayers.length} fake players`);

        // 2. Add all fake players to queue (safe insert)
        const queueEntries = [];
        for (const fakeUser of fakePlayers) {
            // Check if already in queue
            const existing = await prisma.queueEntry.findFirst({
                where: { userId: fakeUser.id, status: 'WAITING' }
            });

            if (!existing) {
                const entry = await prisma.queueEntry.create({
                    data: {
                        userId: fakeUser.id,
                        mmr: fakeUser.rating,
                        status: 'WAITING',
                        isReady: false,
                        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 min
                    }
                });
                queueEntries.push(entry);
            }
        }

        console.log(`[TEST MODE] Added ${queueEntries.length} new fake players to queue`);

        // 3. Add current user to queue (idempotent)
        const existingUserEntry = await prisma.queueEntry.findFirst({
            where: { userId: session.user.id, status: 'WAITING' }
        });

        if (!existingUserEntry) {
            await prisma.queueEntry.create({
                data: {
                    userId: session.user.id,
                    mmr: session.user.rating || 1000,
                    status: 'WAITING',
                    isReady: false,
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000)
                }
            });
            console.log(`[TEST MODE] Added real user to queue: ${session.user.name}`);
        } else {
            console.log(`[TEST MODE] Real user already in queue`);
        }

        // 4. Get second real user from request (if provided)
        const { secondUserId } = await request.json().catch(() => ({}));

        if (secondUserId) {
            await prisma.queueEntry.create({
                data: {
                    userId: secondUserId,
                    mmr: 1000,
                    status: 'WAITING',
                    isReady: false,
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000)
                }
            });
            console.log(`[TEST MODE] Added second real user to queue`);
        }

        // 5. Trigger matchmaking
        // Import and call the matchmaking function
        const { checkQueueAndCreateMatch } = require('@/app/actions/queue');
        await checkQueueAndCreateMatch();

        // 6. AUTO-ACCEPT for Bots (Critical for test mode)
        // Wait a small delay to ensure match is created
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Find the newly created match for this user
        const newMatch = await prisma.matchPlayer.findFirst({
            where: { userId: session.user.id },
            orderBy: { match: { createdAt: 'desc' } },
            include: { match: true }
        });

        if (newMatch && newMatch.match.status === 'READY_CHECK') {
            const matchId = newMatch.matchId;
            console.log(`[TEST MODE] Auto-accepting for bots in match ${matchId}...`);

            // Mark all bots as accepted
            await prisma.matchPlayer.updateMany({
                where: {
                    matchId: matchId,
                    user: { steamId: { startsWith: 'FAKE_BOT_' } }
                },
                data: { accepted: true }
            });
            console.log('[TEST MODE] Bots accepted!');
        }

        return NextResponse.json({
            success: true,
            message: 'Test mode activated! 7 bots + you = 8 players. Bots auto-accepted. Please CLICK ACCEPT!',
            fakePlayers: fakePlayers.length,
            realPlayers: 1
        });

    } catch (error) {
        console.error('[TEST MODE] Error:', error);
        return NextResponse.json(
            { error: 'Failed to activate test mode', details: String(error) },
            { status: 500 }
        );
    }
}
