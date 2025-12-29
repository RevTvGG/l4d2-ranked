import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADMIN_ROLES = ['OWNER', 'ADMIN', 'MODERATOR'];

// DELETE - Unban a player
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const banId = params.id;

        // Check if ban exists
        const ban = await prisma.ban.findUnique({
            where: { id: banId },
            include: { user: true }
        });

        if (!ban) {
            return NextResponse.json({ error: 'Ban not found' }, { status: 404 });
        }

        if (!ban.active) {
            return NextResponse.json({ error: 'Ban is already inactive' }, { status: 400 });
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

        // Update ban to inactive
        await prisma.ban.update({
            where: { id: banId },
            data: {
                active: false,
                unbannedAt: new Date(),
                unbannedById: admin.id
            }
        });

        return NextResponse.json({
            success: true,
            message: `${ban.user.name} has been unbanned`
        });
    } catch (error) {
        console.error('Error unbanning:', error);
        return NextResponse.json({ error: 'Failed to unban' }, { status: 500 });
    }
}
