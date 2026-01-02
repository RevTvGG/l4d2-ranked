import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const now = new Date();

        const announcements = await prisma.announcement.findMany({
            where: {
                active: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: now } }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, announcements });

    } catch (error: any) {
        console.error('Fetch public announcements error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch announcements' },
            { status: 500 }
        );
    }
}
