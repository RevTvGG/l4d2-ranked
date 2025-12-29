import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, canModerateChat } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const role = await requireAdmin();

        if (!canModerateChat(role)) {
            return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();
        const { steamId, reason, duration } = body;

        if (!steamId) {
            return NextResponse.json({ success: false, error: 'SteamID is required' }, { status: 400 });
        }

        // Find user by steamId or name
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { steamId: steamId },
                    { name: { contains: steamId, mode: 'insensitive' } }
                ]
            }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + (duration || 24));

        await prisma.chatMute.create({
            data: {
                userId: user.id,
                reason: reason || null,
                expiresAt
            }
        });

        console.log(`[ADMIN] User ${user.name} (${user.steamId}) muted for ${duration}h. Reason: ${reason}`);

        return NextResponse.json({ success: true, message: 'User muted successfully' });

    } catch (error: any) {
        console.error('Mute user error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message?.includes('Unauthorized') ? 403 : 500 }
        );
    }
}
