import { prisma } from '@/lib/prisma';

// Ban durations in minutes (escalating based on ban count)
const BAN_DURATIONS = {
    AFK_ACCEPT: [15, 60, 180, 720, 1440],      // 15m, 1h, 3h, 12h, 1d
    NO_JOIN: [30, 120, 360, 1440, 4320],       // 30m, 2h, 6h, 1d, 3d
    CRASH: [60, 180, 720, 1440, 4320],         // 1h, 3h, 12h, 1d, 3d
};

type AutoBanReason = 'AFK_ACCEPT' | 'NO_JOIN' | 'CRASH';

/**
 * Get ban duration based on user's ban history
 */
function getBanDuration(banCount: number, reason: AutoBanReason): number {
    const durations = BAN_DURATIONS[reason];
    const index = Math.min(banCount, durations.length - 1);
    return durations[index];
}

/**
 * Check if user is currently banned
 */
export async function isUserBanned(userId: string): Promise<boolean> {
    const activeBan = await prisma.ban.findFirst({
        where: {
            userId,
            active: true,
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ]
        }
    });
    return !!activeBan;
}

/**
 * Get user's active ban info
 */
export async function getActiveBan(userId: string) {
    return prisma.ban.findFirst({
        where: {
            userId,
            active: true,
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ]
        },
        orderBy: { createdAt: 'desc' }
    });
}

/**
 * Create an auto-ban for a user
 */
export async function createAutoBan(
    userId: string,
    reason: AutoBanReason,
    matchId?: string,
    description?: string
): Promise<{ success: boolean; ban?: any; error?: string }> {
    try {
        // Check if already banned
        const existingBan = await isUserBanned(userId);
        if (existingBan) {
            return { success: false, error: 'User is already banned' };
        }

        // Get user's ban count for escalation
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { banCount: true, name: true }
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Calculate duration
        const duration = getBanDuration(user.banCount, reason);
        const expiresAt = new Date(Date.now() + duration * 60 * 1000);

        // Create ban (bannedById = null means auto-ban)
        const ban = await prisma.ban.create({
            data: {
                userId,
                reason,
                description: description || `Auto-ban: ${reason}`,
                duration,
                expiresAt,
                bannedById: null, // System/auto-ban
                matchId
            }
        });

        // Increment ban count
        await prisma.user.update({
            where: { id: userId },
            data: { banCount: { increment: 1 } }
        });

        console.log(`[AutoBan] ${user.name} banned for ${reason} (${duration}m)`);

        return { success: true, ban };
    } catch (error) {
        console.error('[AutoBan] Error:', error);
        return { success: false, error: 'Failed to create ban' };
    }
}

/**
 * Cancel a match and ban the responsible player
 */
export async function cancelMatchAndBanPlayer(
    matchId: string,
    userId: string,
    reason: AutoBanReason,
    description?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Update match status
        await prisma.match.update({
            where: { id: matchId },
            data: {
                status: 'CANCELLED',
                cancelReason: `Player banned: ${reason}`
            }
        });

        // Remove all queue entries for this match
        await prisma.queueEntry.deleteMany({
            where: { matchId }
        });

        // Create ban for the player
        const banResult = await createAutoBan(userId, reason, matchId, description);

        if (!banResult.success) {
            console.error('[CancelMatch] Failed to ban player:', banResult.error);
        }

        return { success: true };
    } catch (error) {
        console.error('[CancelMatch] Error:', error);
        return { success: false, error: 'Failed to cancel match' };
    }
}

/**
 * Handle AFK during ready check - called when timer expires
 */
export async function handleAfkAccept(userId: string, matchId?: string): Promise<void> {
    await createAutoBan(userId, 'AFK_ACCEPT', matchId, 'Did not accept ready check in time');
}

/**
 * Handle player not joining server - called after timeout
 */
export async function handleNoJoin(userId: string, matchId: string): Promise<void> {
    await cancelMatchAndBanPlayer(matchId, userId, 'NO_JOIN', 'Did not connect to server in time');
}

/**
 * Handle player crash without rejoin - called after grace period
 */
export async function handleCrashNoRejoin(userId: string, matchId: string): Promise<void> {
    await cancelMatchAndBanPlayer(matchId, userId, 'CRASH', 'Disconnected and did not rejoin');
}
