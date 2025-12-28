import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// API endpoint to clean up test players from the database
// Only accessible with correct admin key
export async function POST(request: NextRequest) {
    try {
        // Check for admin authorization
        const authHeader = request.headers.get('authorization');
        const adminKey = process.env.ADMIN_API_KEY || 'l4d2ranked-admin-2024';

        if (authHeader !== `Bearer ${adminKey}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('🧹 Cleaning up test players...');

        // Find test players
        const testUsers = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: 'Test', mode: 'insensitive' } },
                    { name: { contains: 'Bot', mode: 'insensitive' } },
                    { steamId: { startsWith: 'BOT_' } },
                    { steamId: { startsWith: 'test_' } },
                    { steamId: { startsWith: 'STEAM_1:' } }, // Fake Steam IDs
                ]
            },
            select: { id: true, name: true, steamId: true }
        });

        if (testUsers.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No test users found. Database is clean!',
                deleted: 0
            });
        }

        const userIds = testUsers.map(u => u.id);

        // Delete related records first
        const queueDeleted = await prisma.queueEntry.deleteMany({
            where: { userId: { in: userIds } }
        });

        const matchPlayersDeleted = await prisma.matchPlayer.deleteMany({
            where: { userId: { in: userIds } }
        });

        const mapVotesDeleted = await prisma.mapVote.deleteMany({
            where: { userId: { in: userIds } }
        });

        const bansDeleted = await prisma.ban.deleteMany({
            where: { userId: { in: userIds } }
        });

        const messagesDeleted = await prisma.message.deleteMany({
            where: { userId: { in: userIds } }
        });

        // Finally delete users
        const usersDeleted = await prisma.user.deleteMany({
            where: { id: { in: userIds } }
        });

        console.log('✅ Cleanup complete!');

        return NextResponse.json({
            success: true,
            message: 'Cleanup complete',
            deleted: {
                users: usersDeleted.count,
                queueEntries: queueDeleted.count,
                matchPlayers: matchPlayersDeleted.count,
                mapVotes: mapVotesDeleted.count,
                bans: bansDeleted.count,
                messages: messagesDeleted.count
            },
            testUsersFound: testUsers.map(u => u.name)
        });

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        return NextResponse.json(
            { error: 'Cleanup failed', details: String(error) },
            { status: 500 }
        );
    }
}

// GET to check test users without deleting
export async function GET(request: NextRequest) {
    try {
        const testUsers = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: 'Test', mode: 'insensitive' } },
                    { name: { contains: 'Bot', mode: 'insensitive' } },
                    { steamId: { startsWith: 'BOT_' } },
                    { steamId: { startsWith: 'test_' } },
                    { steamId: { startsWith: 'STEAM_1:' } },
                ]
            },
            select: { id: true, name: true, steamId: true }
        });

        return NextResponse.json({
            found: testUsers.length,
            users: testUsers
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to check test users', details: String(error) },
            { status: 500 }
        );
    }
}
