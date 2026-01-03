'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function forceReleaseServer(serverId: string) {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['OWNER', 'ADMIN'].includes((session.user as any).role)) {
        return { error: 'Unauthorized' };
    }

    try {
        await prisma.gameServer.update({
            where: { id: serverId },
            data: { status: 'AVAILABLE' }
        });

        // Also fix any stuck matches associated with this server
        // Cancel any matches that are supposedly IN_PROGRESS but the server is being force-released
        await prisma.match.updateMany({
            where: {
                serverId: serverId,
                status: { in: ['IN_PROGRESS', 'WAITING_FOR_PLAYERS'] }
            },
            data: {
                status: 'CANCELLED',
                cancelReason: 'Server force released by admin'
            }
        });

        // Trigger queue check to immediately maximize server usage
        const { checkQueueAndCreateMatch } = await import('./queue');
        // Run in background
        checkQueueAndCreateMatch().catch(err => console.error('Failed to trigger queue from admin:', err));

        revalidatePath('/admin/servers');
        return { success: true };
    } catch (error) {
        console.error('Failed to force release server:', error);
        return { error: 'Failed to release server' };
    }
}

export async function banUser(userId: string) {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['OWNER', 'ADMIN'].includes((session.user as any).role)) {
        return { error: 'Unauthorized' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { stripeSubscriptionId: true }
        });

        if (user?.stripeSubscriptionId) {
            const { stripe } = await import("@/lib/stripe");
            try {
                // Determine if we should cancel immediately or at period end.
                // For bans (cheating), we usually want to revoke access immediately.
                // However, canceling immediately might effectively mean "no refund, no service".
                await stripe.subscriptions.cancel(user.stripeSubscriptionId);
                console.log(`[BAN] Cancelled Stripe subscription for user ${userId}`);
            } catch (stripeError) {
                console.error(`[BAN] Failed to cancel subscription for ${userId}`, stripeError);
                // Continue with banning even if Stripe fails (we can fix manually)
            }
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                role: 'BANNED',
                isPremium: false, // Revoke premium immediately
                stripeSubscriptionId: null, // Clear subscription link
                stripeCurrentPeriodEnd: null
            }
        });

        return { success: true, message: "User banned and subscription cancelled." };

    } catch (error) {
        console.error("Failed to ban user:", error);
        return { error: "Failed to ban user" };
    }
}

/**
 * Get all stuck matches (not COMPLETED/CANCELLED)
 */
export async function getStuckMatches() {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['OWNER', 'ADMIN', 'MODERATOR'].includes((session.user as any).role)) {
        return { error: 'Unauthorized', matches: [] };
    }

    const matches = await prisma.match.findMany({
        where: {
            status: { notIn: ['COMPLETED', 'CANCELLED'] }
        },
        include: {
            players: {
                include: {
                    user: {
                        select: { id: true, name: true, steamId: true }
                    }
                }
            },
            server: {
                select: { name: true, ipAddress: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    return { matches };
}

/**
 * Force cancel a stuck match and free all players
 */
export async function adminCancelMatch(matchId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['OWNER', 'ADMIN'].includes((session.user as any).role)) {
        return { error: 'Unauthorized' };
    }

    console.log('[Admin] Cancelling match:', matchId);

    try {
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: { players: true, server: true }
        });

        if (!match) return { error: 'Match not found' };
        if (match.status === 'COMPLETED' || match.status === 'CANCELLED') {
            return { error: 'Match already finalized' };
        }

        // Delete map votes
        await prisma.mapVote.deleteMany({ where: { matchId } });

        // Get player IDs before deleting
        const playerIds = match.players.map(p => p.userId);

        // Delete match players
        await prisma.matchPlayer.deleteMany({ where: { matchId } });

        // Delete queue entries for affected players
        await prisma.queueEntry.deleteMany({ where: { userId: { in: playerIds } } });

        // Cancel match
        await prisma.match.update({
            where: { id: matchId },
            data: { status: 'CANCELLED', cancelReason: 'Admin cancelled - stuck match' }
        });

        // Free server
        if (match.serverId) {
            await prisma.gameServer.update({
                where: { id: match.serverId },
                data: { status: 'AVAILABLE' }
            });
        }

        revalidatePath('/admin');
        return { success: true, message: `Match cancelled. ${playerIds.length} players freed.` };

    } catch (error) {
        console.error('[Admin] Error cancelling match:', error);
        return { error: 'Failed to cancel match' };
    }
}

/**
 * Force reset ALL stuck matches at once
 */
export async function adminResetAllStuckMatches() {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['OWNER', 'ADMIN'].includes((session.user as any).role)) {
        return { error: 'Unauthorized' };
    }

    console.log('[Admin] Resetting ALL stuck matches');

    try {
        const stuckMatches = await prisma.match.findMany({
            where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
            select: { id: true, serverId: true }
        });

        for (const match of stuckMatches) {
            await prisma.mapVote.deleteMany({ where: { matchId: match.id } });
            await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
            await prisma.match.update({
                where: { id: match.id },
                data: { status: 'CANCELLED', cancelReason: 'Admin bulk reset' }
            });
            if (match.serverId) {
                await prisma.gameServer.update({
                    where: { id: match.serverId },
                    data: { status: 'AVAILABLE' }
                });
            }
        }

        // Clear all queue entries
        await prisma.queueEntry.deleteMany({});

        revalidatePath('/admin');
        return { success: true, message: `Cancelled ${stuckMatches.length} matches. All queues cleared.` };

    } catch (error) {
        return { error: 'Failed to reset matches' };
    }
}

/**
 * DEBUG: Create a test match with bots to test VETO/GAME flow
 */
export async function createTestMatch(friendSteamId?: string) {
    const session = await getServerSession(authOptions);
    // Allow OWNER or ADMIN to create tests
    if (!session?.user || !['OWNER', 'ADMIN'].includes((session.user as any).role)) {
        return { error: 'Unauthorized' };
    }

    const userId = session.user.id;
    console.log('[Test] Creating test match for user:', userId, 'Friend:', friendSteamId);

    try {
        // 1. Create bots if needed (or find friend)
        const botIds = [];
        const botCount = friendSteamId ? 6 : 7; // 1 Human + Friend + 6 Bots = 8 OR 1 Human + 7 Bots = 8

        // If friend provided, add them first
        if (friendSteamId) {
            const friend = await prisma.user.findFirst({ where: { steamId: friendSteamId } });
            if (!friend) {
                // Return descriptive error
                return { error: `Friend with SteamID ${friendSteamId} not found in database. Ask them to login first.` };
            }
            botIds.push(friend.id);
        }

        for (let i = 1; i <= botCount; i++) {
            const botSteamId = `FAKE_BOT_${i}`;
            let bot = await prisma.user.findFirst({ where: { steamId: botSteamId } });

            if (!bot) {
                bot = await prisma.user.create({
                    data: {
                        steamId: botSteamId,
                        name: `Bot ${i}`,
                        image: 'https://avatars.akamai.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
                        role: 'USER',
                        rating: 1000
                    }
                });
            }
            botIds.push(bot.id);
        }

        // 1.5 Clean up stale & reset active servers (Auto-fix)
        // Delete the known bad server entry (27015)
        await prisma.gameServer.deleteMany({ where: { port: 27015 } });

        // Ensure the good server (9190) is AVAILABLE (fix stuck IN_USE)
        await prisma.gameServer.updateMany({
            where: { port: 9190 },
            data: { status: 'AVAILABLE' }
        });

        // 2. Find a server (prioritize active 9190 server)
        let server = await prisma.gameServer.findFirst({
            where: {
                status: 'AVAILABLE',
                port: 9190
            }
        });

        // Fallback: any available server if 9190 not found
        if (!server) {
            server = await prisma.gameServer.findFirst({ where: { status: 'AVAILABLE' } });
        }

        // If no server, check if we have any server at all
        if (!server) {
            server = await prisma.gameServer.findFirst();
        }

        // If still no server, create a dummy one if in dev
        if (!server) {
            return { error: 'No servers available. Please add a server first.' };
        }

        // 3. Create Match
        const match = await prisma.match.create({
            data: {
                status: 'READY_CHECK', // Start in READY_CHECK so humans can click Accept
                serverId: server.id,
                serverIp: server.ipAddress,
                serverPort: server.port,
                serverPassword: 'test-password',
            }
        });

        // 4. Add Players to Match
        const allPlayerIds = [userId, ...botIds];

        // Track humans (Admin + Friend) to create QueueEntries for them
        const humans = [userId];
        if (friendSteamId) humans.push(botIds[0]); // Friend is the first in botIds list

        await prisma.matchPlayer.createMany({
            data: allPlayerIds.map((pid, index) => {
                // Determine if this player is a human (admin or friend)
                const isHuman = pid === userId || (friendSteamId && pid === botIds[0]);
                // Bots are always simple "FAKE_BOT_X" checks usually, but checking against ID list is safer here

                return {
                    matchId: match.id,
                    userId: pid,
                    team: index % 2 === 0 ? 'TEAM_A' : 'TEAM_B',
                    // Humans must accept manualy; Bots auto-accept
                    accepted: !isHuman
                };
            })
        });

        // 5. Create QueueEntry for Humans (so UI shows the Accept popup)
        for (const humanId of humans) {
            // First delete any existing
            await prisma.queueEntry.deleteMany({ where: { userId: humanId } });

            await prisma.queueEntry.create({
                data: {
                    userId: humanId,
                    matchId: match.id,
                    status: 'MATCHED', // This triggers the Ready Check UI
                    isReady: true,
                    mmr: 1000,
                    expiresAt: new Date(Date.now() + 60 * 60 * 1000)
                }
            });
        }

        revalidatePath('/play');
        return { success: true, matchId: match.id };

    } catch (error) {
        console.error('[Test] Failed to create test match:', error);
        return { error: 'Failed to create test match' };
    }
}

export async function resendMatchId(matchId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['OWNER', 'ADMIN'].includes((session.user as any).role)) {
        return { error: 'Unauthorized' };
    }

    try {
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: { server: true }
        });

        if (!match || !match.server) {
            return { error: 'Match or server not found' };
        }

        // Trigger the start-match API again (idempotent for ID setting)
        // We use the API route because it holds the RCON logic
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

        // We can't easily call the API route function directly without mocking Request, 
        // but we can execute RCON directly here since we are in a Server Action

        // actually, let's just trigger the API route fetch, same as voteMap
        // This ensures consistent logic with the retry loop
        fetch(`${baseUrl}/api/server/start-match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchId: match.id })
        }).catch(err => console.error('Failed to trigger manual resend:', err));

        return { success: true, message: 'Triggered Match ID resend sequence' };

    } catch (error) {
        console.error('Failed to resend match ID:', error);
        return { error: 'Failed to resend ID' };
    }
}
