import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';
import { balanceTeams } from '@/lib/matchmaking/teamBalancer';

/**
 * ADMIN: Force create match with current queue (any number of players)
 * Useful for testing with 2, 4, 6 players
 */
export async function POST(request: NextRequest) {
    // Check admin auth
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const { minPlayers } = await request.json().catch(() => ({ minPlayers: 2 }));

        // Get all waiting players
        const waitingPlayers = await prisma.queueEntry.findMany({
            where: { status: 'WAITING' },
            include: { user: true },
            orderBy: { createdAt: 'asc' },
        });

        if (waitingPlayers.length < minPlayers) {
            return NextResponse.json(
                { error: `Not enough players. Need at least ${minPlayers}, found ${waitingPlayers.length}` },
                { status: 400 }
            );
        }

        console.log(`[ADMIN] Force creating match with ${waitingPlayers.length} players`);

        // Balance teams (will work with any even number)
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
            return NextResponse.json(
                { error: 'No available game server found' },
                { status: 503 }
            );
        }

        // Create match
        const match = await prisma.match.create({
            data: {
                status: 'READY',
                serverId: server.id,
                serverIp: server.ipAddress,
                serverPort: server.port,
                serverPassword: Math.random().toString(36).substring(2, 10),
            },
        });

        // Create match players
        const matchPlayers = [];
        for (const player of teamA) {
            matchPlayers.push({
                matchId: match.id,
                userId: player.id,
                team: 'TEAM_A' as const,
                isReady: false,
            });
        }
        for (const player of teamB) {
            matchPlayers.push({
                matchId: match.id,
                userId: player.id,
                team: 'TEAM_B' as const,
                isReady: false,
            });
        }

        await prisma.matchPlayer.createMany({
            data: matchPlayers,
        });

        // Update queue entries
        await prisma.queueEntry.updateMany({
            where: {
                id: { in: waitingPlayers.map(p => p.id) }
            },
            data: {
                status: 'MATCHED',
                matchId: match.id,
            },
        });

        console.log(`[ADMIN] Match created: ${match.id} with ${waitingPlayers.length} players`);

        return NextResponse.json({
            success: true,
            match: {
                id: match.id,
                players: waitingPlayers.length,
                teamA: teamA.length,
                teamB: teamB.length,
                server: `${server.ipAddress}:${server.port}`
            }
        });

    } catch (error) {
        console.error('[ADMIN] Force match error:', error);
        return NextResponse.json(
            { error: 'Failed to create match', details: String(error) },
            { status: 500 }
        );
    }
}
