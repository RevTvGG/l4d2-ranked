import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADMIN_ROLES = ['OWNER', 'ADMIN', 'MODERATOR'];

// GET - List bans
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        // @ts-expect-error - role is custom field
        const userRole = session?.user?.role;

        // Check if admin for full details
        const isAdmin = userRole && ADMIN_ROLES.includes(userRole);

        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter') || 'active';

        let whereClause: any = {};

        if (filter === 'active') {
            whereClause.active = true;
            whereClause.OR = [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ];
        } else if (filter === 'expired') {
            whereClause.OR = [
                { active: false },
                { expiresAt: { lte: new Date() } }
            ];
        }

        const bans = await prisma.ban.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        steamId: true,
                        image: true
                    }
                },
                bannedBy: isAdmin ? {
                    select: { name: true }
                } : false,
                unbannedBy: isAdmin ? {
                    select: { name: true }
                } : false
            }
        });

        return NextResponse.json({ bans });
    } catch (error) {
        console.error('Error fetching bans:', error);
        return NextResponse.json({ error: 'Failed to fetch bans' }, { status: 500 });
    }
}

// POST - Create ban
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // @ts-expect-error - role is custom field
        const userRole = session.user.role;
        if (!userRole || !ADMIN_ROLES.includes(userRole)) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        const { steamId, reason, description, duration } = await request.json();

        if (!steamId || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Find user by steamId or name
        const targetUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { steamId },
                    { name: steamId }
                ]
            }
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get admin user
        // @ts-expect-error - steamId is custom field
        const adminSteamId = session.user.steamId;
        const admin = await prisma.user.findUnique({
            where: { steamId: adminSteamId }
        });

        if (!admin) {
            return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
        }

        // Calculate expiration
        const durationMinutes = parseInt(duration) || 60;
        const expiresAt = durationMinutes === 0
            ? null
            : new Date(Date.now() + durationMinutes * 60 * 1000);

        // Create ban
        const ban = await prisma.ban.create({
            data: {
                userId: targetUser.id,
                reason,
                description: description || null,
                duration: durationMinutes,
                expiresAt,
                bannedById: admin.id
            }
        });

        // Increment ban count
        await prisma.user.update({
            where: { id: targetUser.id },
            data: { banCount: { increment: 1 } }
        });

        return NextResponse.json({
            success: true,
            message: `${targetUser.name} has been banned`,
            banId: ban.id
        });
    } catch (error) {
        console.error('Error creating ban:', error);
        return NextResponse.json({ error: 'Failed to create ban' }, { status: 500 });
    }
}
