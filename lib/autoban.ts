import { prisma } from '@/lib/prisma';

// Ban durations in minutes (escalating based on ban count)
const BAN_DURATIONS = {
    AFK_ACCEPT: [15, 60, 180, 720, 1440],      // 15m, 1h, 3h, 12h, 1d
    NO_JOIN: [30, 120, 360, 1440, 4320],       // 30m, 2h, 6h, 1d, 3d
    CRASH: [60, 180, 720, 1440, 4320],         // 1h, 3h, 12h, 1d, 3d
    RAGE_QUIT: [60, 360, 1440, 4320, 10080],   // 1h, 6h, 1d, 3d, 1 week
    NO_REJOIN: [60, 180, 720, 1440, 4320],     // Same as CRASH (not intentional)
};

type AutoBanReason = 'AFK_ACCEPT' | 'NO_JOIN' | 'CRASH' | 'RAGE_QUIT' | 'NO_REJOIN';

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

/**
 * Forfeit a match when a player leaves/disconnects and doesn't return
 * - Winner team gets full ELO (as if they won normally)
 * - Only the quitter loses ELO (as a normal loss)
 * - Other teammates of the quitter are NOT penalized
 * - Quitter gets banned
 */
export async function forfeitMatchAndBanPlayer(
    matchId: string,
    quitterUserId: string,
    reason: AutoBanReason,
    description?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get match with all players
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                players: {
                    include: {
                        user: true
                    }
                }
            }
        });

        if (!match) {
            return { success: false, error: 'Match not found' };
        }

        // Find the quitter and their team
        const quitter = match.players.find(p => p.userId === quitterUserId);
        if (!quitter) {
            return { success: false, error: 'Quitter not found in match' };
        }

        const quitterTeam = quitter.team;
        const winnerTeam = quitterTeam === '1' || quitterTeam === 'TEAM_A' ? '2' : '1';

        // Calculate ELO changes (standard K-factor of 32)
        const K = 32;
        const avgWinnerRating = match.players
            .filter(p => p.team !== quitterTeam)
            .reduce((sum, p) => sum + (p.user.rating || 1000), 0) / 4 || 1000;

        const avgLoserRating = match.players
            .filter(p => p.team === quitterTeam)
            .reduce((sum, p) => sum + (p.user.rating || 1000), 0) / 4 || 1000;

        // Expected scores
        const expectedWinner = 1 / (1 + Math.pow(10, (avgLoserRating - avgWinnerRating) / 400));
        const eloGain = Math.round(K * (1 - expectedWinner));
        const eloLoss = Math.round(K * expectedWinner);

        // Update winners (give ELO)
        for (const player of match.players) {
            if (player.team !== quitterTeam) {
                await prisma.user.update({
                    where: { id: player.userId },
                    data: {
                        rating: { increment: eloGain },
                        wins: { increment: 1 }
                    }
                });
                console.log(`[Forfeit] ${player.user.name} gained ${eloGain} ELO (winner)`);
            }
        }

        // Only the quitter loses ELO (teammates are not penalized)
        const quitterUser = quitter.user;
        await prisma.user.update({
            where: { id: quitterUserId },
            data: {
                rating: { decrement: eloLoss },
                losses: { increment: 1 }
            }
        });
        console.log(`[Forfeit] ${quitterUser.name} lost ${eloLoss} ELO (quitter)`);

        // Update match as completed with winner
        await prisma.match.update({
            where: { id: matchId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                winnerTeam: winnerTeam === '2' ? 'B' : 'A',
                cancelReason: `Forfeit: ${reason} by ${quitterUser.name}`
            }
        });

        // Remove queue entries
        await prisma.queueEntry.deleteMany({
            where: { matchId }
        });

        // Ban the quitter
        const banResult = await createAutoBan(quitterUserId, reason, matchId, description);

        if (!banResult.success) {
            console.error('[Forfeit] Failed to ban quitter:', banResult.error);
        }

        console.log(`[Forfeit] Match ${matchId} forfeited. Winner: Team ${winnerTeam}, Quitter: ${quitterUser.name}`);

        return { success: true };
    } catch (error) {
        console.error('[Forfeit] Error:', error);
        return { success: false, error: 'Failed to process forfeit' };
    }
}

