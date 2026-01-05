'use server';

// Queue Management and Match Creation Logic

import { prisma } from '@/lib/prisma';
import { balanceTeams } from '@/lib/matchmaking/teamBalancer';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { unstable_noStore as noStore } from 'next/cache';

/**
 * Check queue for 8+ waiting players and create match
 * Called periodically (every 5 seconds via cron or polling)
 */
export async function checkQueueAndCreateMatch() {
    const waitingPlayers = await prisma.queueEntry.findMany({
        where: { status: 'WAITING' },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
        take: 8,
    });

    if (waitingPlayers.length < 8) {
        return; // Not enough players
    }

    console.log(`[Queue] Found ${waitingPlayers.length} waiting players, creating match...`);

    // Balance teams
    const players = waitingPlayers.map(entry => ({
        id: entry.user.id,
        name: entry.user.name,
        rating: entry.user.rating,
        steamId: entry.user.steamId || undefined
    }));

    const { teamA, teamB } = balanceTeams(players as any);

    // Get available server
    const server = await prisma.gameServer.findFirst({
        where: {
            isActive: true,
            status: 'AVAILABLE'
        }
    });

    if (!server) {
        console.error('[Queue] No available game server found');
        return;
    }

    // Create match with server assigned
    const match = await prisma.match.create({
        data: {
            status: 'READY_CHECK',
            serverId: server.id,
            serverIp: server.ipAddress,
            serverPort: server.port,
            serverPassword: Math.random().toString(36).substring(2, 10),
        },
    });

    console.log(`[Queue] Created match ${match.id} on server ${server.ipAddress}:${server.port}`);

    // Create match players with team assignments
    for (const player of teamA) {
        await prisma.matchPlayer.create({
            data: {
                matchId: match.id,
                userId: player.id,
                team: 'TEAM_A',
            },
        });
    }

    for (const player of teamB) {
        await prisma.matchPlayer.create({
            data: {
                matchId: match.id,
                userId: player.id,
                team: 'TEAM_B',
            },
        });
    }

    // Update queue entries to MATCHED status
    await prisma.queueEntry.updateMany({
        where: { id: { in: waitingPlayers.map(p => p.id) } },
        data: {
            status: 'MATCHED',
            matchId: match.id
        },
    });

    console.log(`[Queue] Match ${match.id} created with ${teamA.length + teamB.length} players`);

    // Enable ready-check timeout (60 seconds)
    setTimeout(() => checkReadyTimeout(match.id), 60000);
}

/**
 * Check if all players are ready after 60 seconds
 * If not all ready: kick non-ready players, apply strikes (3+ = 30min ban), find replacements
 */
async function checkReadyTimeout(matchId: string) {
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
            queueEntries: { include: { user: true } },
            server: true // Include server to release it if match is cancelled
        },
    });

    if (!match) return;
    if (match.status !== 'READY_CHECK') return; // Already moved past ready check

    const readyPlayers = match.queueEntries.filter((q) => q.isReady);
    const notReadyPlayers = match.queueEntries.filter((q) => !q.isReady);

    if (readyPlayers.length === 8) {
        // All ready! Proceed to team balancing and map voting
        await proceedToMapVoting(matchId);
        return;
    }

    console.log(`[Queue] Ready timeout for match ${matchId} - ${notReadyPlayers.length} players not ready`);

    // Process each non-ready player: increment strikes and apply ban if needed
    for (const player of notReadyPlayers) {
        // Increment strikes
        const user = await prisma.user.update({
            where: { id: player.userId },
            data: { readyCheckStrikes: { increment: 1 } }
        });

        const strikes = user.readyCheckStrikes;
        console.log(`[Queue] Player ${user.name} now has ${strikes} strikes`);

        // Determine ban duration based on strikes
        // 1-2 strikes: warning (no ban)
        // 3+ strikes: 30 minute ban
        if (strikes >= 3) {
            await prisma.ban.create({
                data: {
                    userId: player.userId,
                    reason: 'AFK_ACCEPT',
                    description: `Auto-ban: Failed to accept ready check ${strikes} times`,
                    duration: 30, // 30 minutes
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
                },
            });
            console.log(`[Queue] Player ${user.name} banned for 30 min (${strikes} strikes)`);
        }

        // Mark queue entry as timeout
        await prisma.queueEntry.update({
            where: { id: player.id },
            data: { status: 'TIMEOUT' }
        });
    }

    // Try to find replacements for non-ready players
    const replacementsNeeded = notReadyPlayers.length;
    const foundReplacements = await findReplacementsForMatch(matchId, replacementsNeeded, readyPlayers);

    if (foundReplacements >= replacementsNeeded) {
        // All replacements found! Continue match with new players
        console.log(`[Queue] Found ${foundReplacements} replacements, continuing match`);
        // Don't proceed to voting yet - new players need time to accept
        // The new players will trigger checkReadyTimeout again when they're added
    } else {
        // Not enough replacements - cancel match and RELEASE SERVER
        console.log(`[Queue] Only found ${foundReplacements}/${replacementsNeeded} replacements, cancelling match`);

        // Release the server first
        if (match.serverId) {
            await prisma.gameServer.update({
                where: { id: match.serverId },
                data: { status: 'AVAILABLE' }
            });
            console.log(`[Queue] Released server ${match.serverId} (match cancelled before start)`);
        }

        await prisma.match.update({
            where: { id: matchId },
            data: {
                status: 'CANCELLED',
                cancelReason: `Not all players ready (${notReadyPlayers.length} AFK)`,
            },
        });

        // Clear remaining queue entries for this match
        await prisma.queueEntry.updateMany({
            where: { matchId },
            data: { status: 'DECLINED', matchId: null }
        });

        // Retry with remaining queue
        await checkQueueAndCreateMatch();
    }
}

/**
 * Find replacement players from the queue for a match
 * Returns number of replacements successfully added
 */
async function findReplacementsForMatch(matchId: string, count: number, existingPlayers: any[]): Promise<number> {
    if (count <= 0) return 0;

    // Calculate average rating of existing players
    const avgRating = existingPlayers.length > 0
        ? existingPlayers.reduce((sum, p) => sum + (p.user?.rating || 1000), 0) / existingPlayers.length
        : 1000;
    const ratingRange = 200; // +/- 200 rating tolerance

    // Find waiting players with similar rating
    const waitingPlayers = await prisma.queueEntry.findMany({
        where: {
            status: 'WAITING',
            user: {
                rating: {
                    gte: avgRating - ratingRange,
                    lte: avgRating + ratingRange
                }
            }
        },
        include: { user: true },
        orderBy: { user: { rating: 'desc' } }, // Prefer higher rating players
        take: count
    });

    if (waitingPlayers.length === 0) {
        console.log(`[Queue] No replacement players found in queue with rating ${avgRating - ratingRange}-${avgRating + ratingRange}`);
        return 0;
    }

    let added = 0;
    for (const replacement of waitingPlayers) {
        // Determine team based on current imbalance
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: { players: true }
        });

        if (!match) continue;

        const teamACount = match.players.filter(p => p.team === 'TEAM_A').length;
        const teamBCount = match.players.filter(p => p.team === 'TEAM_B').length;
        const assignTeam = teamACount <= teamBCount ? 'TEAM_A' : 'TEAM_B';

        await prisma.matchPlayer.create({
            data: {
                matchId,
                userId: replacement.userId,
                team: assignTeam
            }
        });

        // Update queue entry to MATCHED
        await prisma.queueEntry.update({
            where: { id: replacement.id },
            data: {
                status: 'MATCHED',
                matchId,
                isReady: false // New player must accept
            }
        });

        console.log(`[Queue] Added replacement ${replacement.user.name} (${replacement.user.rating}) to ${assignTeam}`);
        added++;
    }

    return added;
}

/**
 * Player ready-up action
 */
export async function readyUp(matchId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) return { error: 'Not authenticated' };

    await prisma.queueEntry.updateMany({
        where: {
            matchId,
            userId: session.user.id,
        },
        data: { isReady: true },
    });

    // Check if all ready
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: { queueEntries: true },
    });

    const allReady = match?.queueEntries.every((q) => q.isReady);

    if (allReady && match) {
        // All ready before timeout! Proceed immediately
        await proceedToMapVoting(match.id);
    }

    return { success: true, allReady };
}

/**
 * Proceed to map voting phase
 * Balance teams and change status to VETO
 */
async function proceedToMapVoting(matchId: string) {
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: { players: { include: { user: true } } },
    });

    if (!match) return;

    // Calculate team stats for logging
    const teamA = match.players.filter((p: any) => p.team === 'TEAM_A');
    const teamB = match.players.filter((p: any) => p.team === 'TEAM_B');
    const avgEloA = teamA.length > 0 ? Math.round(teamA.reduce((sum: number, p: any) => sum + (p.user.rating || 1000), 0) / teamA.length) : 0;
    const avgEloB = teamB.length > 0 ? Math.round(teamB.reduce((sum: number, p: any) => sum + (p.user.rating || 1000), 0) / teamB.length) : 0;
    const eloDifference = Math.abs(avgEloA - avgEloB);

    // Update match status to map voting
    await prisma.match.update({
        where: { id: matchId },
        data: { status: 'VETO' },
    });

    console.log(`[Queue] Match ${matchId} - Teams balanced (ELO diff: ${eloDifference})`);
    console.log(`  Team A (${avgEloA}): ${teamA.map((p: any) => p.user.name).join(', ')}`);
    console.log(`  Team B (${avgEloB}): ${teamB.map((p: any) => p.user.name).join(', ')}`);

    // Start map voting timer (60 seconds)
    setTimeout(() => finalizeMapVoting(matchId), 60000);
}

/**
 * Vote for a map
 */
export async function voteForMap(matchId: string, mapId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) return { error: 'Not authenticated' };

    // SECURITY CHECK: Verify user is a participant in this match
    const participant = await prisma.matchPlayer.count({
        where: {
            matchId,
            userId: session.user.id
        }
    });

    if (participant === 0) {
        return { error: "You are not a participant in this match" };
    }

    await prisma.mapVote.upsert({
        where: {
            matchId_userId: {
                matchId,
                userId: session.user.id,
            },
        },
        update: { map: mapId },
        create: {
            matchId,
            userId: session.user.id,
            map: mapId,
        },
    });

    // Check if all players voted
    const votes = await prisma.mapVote.count({ where: { matchId } });
    if (votes >= 8) {
        await finalizeMapVoting(matchId);
    }

    return { success: true };
}

/**
 * Finalize map voting and start match
 * Players who didn't vote are kicked FUERA de la cola (no reenqueue)
 */
async function finalizeMapVoting(matchId: string) {
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
            players: { include: { user: true } },
            mapVotes: true
        }
    });

    if (!match || match.status !== 'VETO') return; // Already processed

    // Find players who didn't vote
    const votedUserIds = match.mapVotes.map(v => v.userId);
    const noVotePlayers = match.players.filter(p => !votedUserIds.includes(p.userId));

    if (noVotePlayers.length > 0) {
        console.log(`[Queue] Veto timeout - ${noVotePlayers.length} players didn't vote`);

        // Remove non-voters from match and queue (FUERA de cola, sin reencolar)
        for (const player of noVotePlayers) {
            // Remove from MatchPlayer
            await prisma.matchPlayer.delete({
                where: { id: player.id }
            });

            // Remove from queue completely (FUERA de cola)
            await prisma.queueEntry.deleteMany({
                where: {
                    userId: player.userId,
                    matchId: matchId
                }
            });

            console.log(`[Queue] Removed ${player.user.name} for not voting (out of queue)`);
        }

        // Check if we have enough players left
        const remainingPlayers = await prisma.matchPlayer.count({
            where: { matchId }
        });

        if (remainingPlayers < 8) {
            // Not enough players - cancel match and RELEASE SERVER
            console.log(`[Queue] Only ${remainingPlayers} players left, cancelling match`);

            // Release the server first
            if (match.serverId) {
                await prisma.gameServer.update({
                    where: { id: match.serverId },
                    data: { status: 'AVAILABLE' }
                });
                console.log(`[Queue] Released server ${match.serverId} (match cancelled during veto)`);
            }

            await prisma.match.update({
                where: { id: matchId },
                data: {
                    status: 'CANCELLED',
                    cancelReason: `Not enough players after veto (${noVotePlayers.length} didn't vote)`
                }
            });

            // Release remaining queue entries
            await prisma.queueEntry.updateMany({
                where: { matchId },
                data: { status: 'DECLINED', matchId: null }
            });

            // Try to create new match with remaining queue
            await checkQueueAndCreateMatch();
            return;
        }
    }

    // Count votes
    const votes = await prisma.mapVote.groupBy({
        by: ['map'],
        where: { matchId },
        _count: { map: true },
        orderBy: { _count: { map: 'desc' } },
    });

    const winningMap = votes[0]?.map || 'c1m1_hotel'; // Default to Dead Center

    // Update match with selected map
    await prisma.match.update({
        where: { id: matchId },
        data: {
            selectedMap: winningMap,
            mapName: winningMap,
            status: 'READY', // Ready to start
        },
    });

    console.log(`[Queue] Match ${matchId} - Map selected: ${winningMap}`);

    // Trigger server setup (this will be called by the match start API)
    // The /api/server/start-match endpoint will handle RCON communication
}

/**
 * Leave queue
 */
export async function leaveQueue() {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) return { error: 'Not authenticated' };

    await prisma.queueEntry.deleteMany({
        where: {
            userId: session.user.id,
            status: { in: ['WAITING', 'READY_CHECK'] },
        },
    });

    return { success: true };
}

/**
 * RESET - Force clear all queue and match state for a stuck player
 */
export async function resetQueueState() {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) return { error: 'Not authenticated' };

    const userId = session.user.id;
    console.log('[resetQueueState] Resetting state for user:', userId);

    // Delete ALL queue entries for this user (any status)
    await prisma.queueEntry.deleteMany({
        where: { userId }
    });
    console.log('[resetQueueState] Deleted all queue entries');

    // Delete ALL match player entries for this user
    await prisma.matchPlayer.deleteMany({
        where: { userId }
    });
    console.log('[resetQueueState] Deleted all match player entries');

    // Delete any map votes
    await prisma.mapVote.deleteMany({
        where: { userId }
    });
    console.log('[resetQueueState] Deleted all map votes');

    return { success: true, message: 'Queue state reset successfully' };
}

/**
 * Get queue status for current user
 */
export async function getQueueStatus() {
    noStore(); // Force dynamic behavior
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;

    const queueEntry = await prisma.queueEntry.findFirst({
        where: {
            userId: session.user.id,
            status: { in: ['WAITING', 'READY_CHECK', 'MATCHED'] },
        },
        include: {
            match: true,
        },
    });

    // Get next 8 players in queue (for preview)
    const nextPlayers = await prisma.queueEntry.findMany({
        where: {
            status: 'WAITING'
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    rating: true
                }
            }
        },
        orderBy: { createdAt: 'asc' },
        take: 8
    });

    // Get total count
    const totalInQueue = await prisma.queueEntry.count({
        where: { status: 'WAITING' }
    });

    const activeMatches = await prisma.match.count({
        where: {
            status: { in: ['READY', 'VETO', 'WAITING_FOR_PLAYERS', 'IN_PROGRESS'] }
        }
    });

    // Return queue entry with all its properties + queue preview
    if (queueEntry) {
        // Check if match is completed - if so, cleanup and return empty
        if (queueEntry.match && queueEntry.match.status === 'COMPLETED') {
            // Auto-cleanup: delete this stale queue entry
            await prisma.queueEntry.delete({
                where: { id: queueEntry.id }
            });
            console.log(`[Queue] Auto-cleaned completed match entry for user ${session.user.id}`);

            // Return as if not in queue
            return {
                status: null,
                matchId: null,
                nextPlayers,
                totalInQueue,
                activeMatches
            };
        }

        return {
            ...queueEntry,
            nextPlayers,
            totalInQueue,
            activeMatches
        };
    }

    // Return queue stats even if not in queue
    return {
        queueEntry: null,
        nextPlayers,
        totalInQueue,
        activeMatches
    };
}

/**
 * Join the matchmaking queue
 */
export async function joinQueue() {
    console.log('[joinQueue] Starting...');

    const session = await getServerSession(authOptions);
    console.log('[joinQueue] Session:', session ? 'exists' : 'null');
    console.log('[joinQueue] User:', session?.user);

    if (!session?.user) {
        console.error('[joinQueue] No session or user');
        return { success: false, message: 'Not authenticated' };
    }

    const userId = (session.user as any).id;
    console.log('[joinQueue] User ID:', userId);

    if (!userId) {
        console.error('[joinQueue] No user ID found');
        return { success: false, message: 'User ID not found' };
    }

    // Check if already in queue
    const existing = await prisma.queueEntry.findFirst({
        where: {
            userId: userId,
            status: { in: ['WAITING', 'READY_CHECK', 'MATCHED'] },
        },
    });

    if (existing) {
        console.log('[joinQueue] User already in queue');
        return { success: true, message: 'Already in queue' };
    }

    // Check if at least one server is available
    const availableServer = await prisma.gameServer.findFirst({
        where: {
            isActive: true,
            status: 'AVAILABLE'
        }
    });

    if (!availableServer) {
        console.error('[joinQueue] No servers available');
        return { success: false, message: 'No servers available. Please try again later.' };
    }

    // Get user data including rating and betaAccess
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { rating: true, betaAccess: true },
    });

    console.log('[joinQueue] User rating:', user?.rating);
    console.log('[joinQueue] User betaAccess:', user?.betaAccess);

    // Check if user has beta access
    if (!user?.betaAccess) {
        console.log('[joinQueue] User does not have beta access');
        return {
            success: false,
            message: 'Beta access required. Please enter your invite code at /beta/verify'
        };
    }

    // Check if user is banned
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

    if (activeBan) {
        console.log('[joinQueue] User is banned');
        return {
            success: false,
            message: activeBan.expiresAt
                ? `You are banned until ${activeBan.expiresAt.toLocaleString()}`
                : 'You are permanently banned'
        };
    }

    // Create queue entry
    await prisma.queueEntry.create({
        data: {
            userId: userId,
            status: 'WAITING',
            mmr: user?.rating || 1000,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        },
    });

    console.log('[joinQueue] Queue entry created successfully');

    // Check if we can create a match
    try {
        await checkQueueAndCreateMatch();
    } catch (error) {
        console.error('[joinQueue] Failed to check match creation:', error);
        // Don't fail the join action, just log the error
    }

    return { success: true, message: 'Joined queue' };
}

