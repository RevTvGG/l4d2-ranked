import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTestAuth } from '@/lib/testAuth';

export async function POST(request: NextRequest) {
    // Verificar autenticación
    const authError = requireTestAuth(request);
    if (authError) return authError;

    try {
        const { playerCount = 8 } = await request.json();

        // Create test users
        const testPlayers = [];
        for (let i = 1; i <= playerCount; i++) {
            const steamId = `STEAM_1:0:${10000 + i}`;

            const user = await prisma.user.upsert({
                where: { steamId },
                update: {},
                create: {
                    steamId,
                    name: `TestPlayer${i}`,
                    rating: 1000 + (i * 50),
                    totalHours: 100,
                }
            });

            testPlayers.push(user);
        }

        // Add all to queue
        for (const player of testPlayers) {
            await prisma.queueEntry.create({
                data: {
                    userId: player.id,
                    status: 'WAITING',
                    mmr: player.rating,
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
                }
            });
        }

        // Trigger match creation
        const { checkQueueAndCreateMatch } = await import('@/app/actions/queue');
        await checkQueueAndCreateMatch();

        // Get the created match
        const match = await prisma.match.findFirst({
            where: {
                status: { in: ['READY_CHECK', 'VETO', 'READY'] }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            success: true,
            playersCreated: testPlayers.length,
            matchId: match?.id,
            matchStatus: match?.status
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
