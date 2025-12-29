import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        await requireAdmin();

        const mutes = await prisma.chatMute.findMany({
            where: {
                expiresAt: { gt: new Date() }
            },
            include: {
                user: {
                    select: { id: true, name: true, steamId: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, mutes });

    } catch (error: any) {
        console.error('Fetch mutes error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message?.includes('Unauthorized') ? 403 : 500 }
        );
    }
}
