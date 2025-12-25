'use server';

// Queue Management and Match Creation Logic

import { prisma } from '@/lib/prisma';
import { balanceTeams } from '@/lib/matchmaking/teamBalancer';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
        where: { isActive: true }
    });

    if (!server) {
        console.error('[Queue] No active game server available');
        return;
    }

    // Create match with server assigned
    const match = await prisma.match.create({
        data: {
            status: 'READY_CHECK',
            serverId: server.id,
            serverIp: server.ip,
            serverPort: server.port,
            serverPassword: Math.random().toString(36).substring(2, 10),
        },
    });

    console.log(`[Queue] Created match ${match.id} on server ${server.ip}:${server.port}`);

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

    // Start 30-second ready timer
    setTimeout(() => checkReadyTimeout(match.id), 30000);

    return { matchId: match.id, message: 'Ready check started', players: 8 };
}

/**
 * Check if all players are ready after 30 seconds
 * If not all ready: kick non-ready players, ban them, retry with next players
 */
async function checkReadyTimeout(matchId: string) {
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: { queueEntries: { include: { user: true } } },
    });

    if (!match) return;

    const readyPlayers = match.queueEntries.filter((q) => q.isReady);
    const notReadyPlayers = match.queueEntries.filter((q) => !q.isReady);

    if (readyPlayers.length === 8) {
        // All ready! Proceed to team balancing and map voting
        await proceedToMapVoting(matchId);
        return;
    }

    // Kick non-ready players from queue
    await prisma.queueEntry.updateMany({
        where: { id: { in: notReadyPlayers.map((p) => p.id) } },
        data: { status: 'TIMEOUT' },
    });

    // Ban AFKers for 5 minutes
    for (const player of notReadyPlayers) {
        await prisma.ban.create({
            data: {
                userId: player.userId,
                reason: 'AFK_ACCEPT',
                duration: 5,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            },
        });
    }

    // Cancel this match
    await prisma.match.update({
        where: { id: matchId },
        data: {
            status: 'CANCELLED',
            cancelReason: 'Not all players ready',
        },
    });

    console.log(`[Queue] Match ${matchId} cancelled - ${notReadyPlayers.length} players not ready`);

    // Retry with next players in queue
    await checkQueueAndCreateMatch();
}

/**
 * Player ready-up action
 */
export async function readyUp(matchId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error('Not authenticated');

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
        include: { matchPlayers: { include: { user: true } } }, // Use matchPlayers
    });

    if (!match) return;

    // Teams are already balanced and assigned in checkQueueAndCreateMatch
    // Just update match status to map voting
    await prisma.match.update({
        where: { id: matchId },
        data: { status: 'VETO' },
    });

    console.log(`[Queue] Match ${matchId} - Teams balanced (ELO diff: ${eloDifference})`);
    console.log(`  Team A (${avgEloA}): ${teamA.map((p) => p.name).join(', ')}`);
    console.log(`  Team B (${avgEloB}): ${teamB.map((p) => p.name).join(', ')}`);

    // Start map voting timer (30 seconds)
    setTimeout(() => finalizeMapVoting(matchId), 30000);
}

/**
 * Vote for a map
 */
export async function voteForMap(matchId: string, mapId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error('Not authenticated');

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
 */
async function finalizeMapVoting(matchId: string) {
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
    if (!session?.user) throw new Error('Not authenticated');

    await prisma.queueEntry.deleteMany({
        where: {
            userId: session.user.id,
            status: { in: ['WAITING', 'READY_CHECK'] },
        },
    });

    return { success: true };
}

/**
 * Get queue status for current user
 */
export async function getQueueStatus() {
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

    // Return queue entry with all its properties
    if (queueEntry) {
        return queueEntry;
    }

    // Return null if not in queue
    return null;
}

/**
 * Join the matchmaking queue
 */
export async function joinQueue() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, message: 'Not authenticated' };

    // Check if already in queue
    const existing = await prisma.queueEntry.findFirst({
        where: {
            userId: session.user.id,
            status: { in: ['WAITING', 'READY_CHECK', 'MATCHED'] },
        },
    });

    if (existing) {
        return { success: true, message: 'Already in queue' };
    }

    // Get user rating for MMR
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { rating: true },
    });

    // Create queue entry
    await prisma.queueEntry.create({
        data: {
            userId: session.user.id,
            status: 'WAITING',
            mmr: user?.rating || 1000,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        },
    });

    // Check if we can create a match
    await checkQueueAndCreateMatch();

    return { success: true, message: 'Joined queue' };
}
