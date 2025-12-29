import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADMIN_ROLES = ['OWNER', 'ADMIN', 'MODERATOR'];

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        // @ts-expect-error - role is custom field
        const userRole = session.user.role;
        if (!userRole || !ADMIN_ROLES.includes(userRole)) {
            return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { duration, reason } = body;

        // Check target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id },
            select: { role: true, name: true }
        });

        if (!targetUser) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // Cannot ban owner
        if (targetUser.role === 'OWNER') {
            return NextResponse.json({ success: false, error: 'Cannot ban the owner' }, { status: 403 });
        }

        // Check if already banned
        const existingBan = await prisma.ban.findFirst({
            where: {
                userId: id,
                active: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            }
        });

        if (existingBan) {
            return NextResponse.json({
                success: false,
                error: 'User is already banned. Go to Ban Management to unban first.',
                existingBanId: existingBan.id
            }, { status: 400 });
        }

        // Get admin ID from session
        // @ts-expect-error - steamId is custom field
        const adminSteamId = session.user.steamId;
        const admin = await prisma.user.findUnique({
            where: { steamId: adminSteamId }
        });

        if (!admin) {
            return NextResponse.json({ success: false, error: 'Admin user not found' }, { status: 404 });
        }

        // Create ban
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + (duration || 24));

        await prisma.ban.create({
            data: {
                userId: id,
                reason: reason || 'MANUAL',
                duration: duration ? duration * 60 : 1440, // duration comes in hours from frontend, store in minutes
                expiresAt,
                active: true,
                bannedById: admin.id,
                description: `Banned from Player Management by ${admin.name}`
            }
        });

        // Increment ban count
        await prisma.user.update({
            where: { id },
            data: { banCount: { increment: 1 } }
        });

        console.log(`[ADMIN] User ${id} (${targetUser.name}) banned by ${admin.name}`);

        return NextResponse.json({ success: true, message: 'Player banned successfully' });

    } catch (error: any) {
        console.error('Ban player error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
