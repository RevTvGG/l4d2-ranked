import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyServerKey, errorResponse, successResponse } from '@/lib/serverAuth';

const GRACE_PERIOD_SECONDS = 300; // 5 minutes

/**
 * POST /api/match/player-disconnect
 * Track player disconnections during match
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { matchId, serverKey, steamId, reason } = body;

        // Verify server authentication
        const server = await verifyServerKey(serverKey);
        if (!server) {
            return errorResponse('Invalid server key', 'UNAUTHORIZED', 401);
        }

        // Find match player
        const matchPlayer = await prisma.matchPlayer.findFirst({
            where: {
                matchId,
                user: {
                    steamId
                }
            },
            include: {
                user: true
            }
        });

        if (!matchPlayer) {
            return errorResponse('Player not found in match', 'NOT_FOUND', 404);
        }

        // Update disconnect timestamp
        await prisma.matchPlayer.update({
            where: { id: matchPlayer.id },
            data: {
                disconnectedAt: new Date(),
                disconnectReason: reason
            }
        });

        // If reason is QUIT (intentional), apply immediate ban
        if (reason === 'QUIT') {
            await prisma.ban.create({
                data: {
                    userId: matchPlayer.user.id,
                    reason: 'ABANDON',
                    duration: 30, // 30 minutes
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000)
                }
            });

            // Increment ban count
            await prisma.user.update({
                where: { id: matchPlayer.user.id },
                data: {
                    banCount: { increment: 1 }
                }
            });
        }

        return successResponse({
            gracePeriod: GRACE_PERIOD_SECONDS,
            message: reason === 'QUIT'
                ? 'Player banned for abandonment'
                : 'Grace period started'
        });

    } catch (error) {
        console.error('Player disconnect error:', error);
        return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }
}
