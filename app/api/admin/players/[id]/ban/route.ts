import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, canBanPlayers, getAdminRole } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const role = await requireAdmin();

        if (!canBanPlayers(role)) {
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

        // Create ban
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + (duration || 24));

        await prisma.ban.create({
            data: {
                userId: id,
                reason: 'MANUAL',
                duration: duration || 24,
                expiresAt,
                active: true
            }
        });

        // Increment ban count
        await prisma.user.update({
            where: { id },
            data: { banCount: { increment: 1 } }
        });

        console.log(`[ADMIN] User ${id} (${targetUser.name}) banned for ${duration}h. Reason: ${reason}`);

        return NextResponse.json({ success: true, message: 'Player banned successfully' });

    } catch (error: any) {
        console.error('Ban player error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: error.message?.includes('Unauthorized') ? 403 : 500 }
        );
    }
}
