import { NextResponse } from 'next/server';
import { requireAdmin, canManageAnnouncements } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        const role = await requireAdmin();

        if (!canManageAnnouncements(role)) {
            return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
        }

        const title = "Beta Notice";
        const content = `L4D2 Ranked is currently in BETA. You may experience bugs, errors, or unexpected behavior.

Known Limitations:
- Matchmaking may occasionally fail to connect
- Stats may not update immediately
- Server connection issues may occur

Please report issues to our Discord.

IMPORTANT: Before playing, you MUST read our FAQ & Ban Policies.`;

        // Check if already exists
        const existing = await prisma.announcement.findFirst({
            where: { title: title }
        });

        if (existing) {
            return NextResponse.json({ success: true, message: "Announcement already exists", skipped: true });
        }

        const announcement = await prisma.announcement.create({
            data: {
                title: title,
                content: content,
                type: "WARNING",
                location: "GLOBAL",
                active: true
            }
        });

        return NextResponse.json({ success: true, announcement, message: "Created default announcement" });

    } catch (error: any) {
        console.error('Seed announcement error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message?.includes('Unauthorized') ? 403 : 500 }
        );
    }
}
