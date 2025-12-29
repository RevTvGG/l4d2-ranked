import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, canManageAnnouncements, getAdminRole } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        await requireAdmin();

        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, announcements });

    } catch (error: any) {
        console.error('Fetch announcements error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message?.includes('Unauthorized') ? 403 : 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const role = await requireAdmin();

        if (!canManageAnnouncements(role)) {
            return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();
        const { title, content, type, location, expiresAt } = body;

        if (!title || !content) {
            return NextResponse.json({ success: false, error: 'Title and content are required' }, { status: 400 });
        }

        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                type: type || 'INFO',
                location: location || 'HOME',
                active: true,
                expiresAt: expiresAt ? new Date(expiresAt) : null
            }
        });

        console.log(`[ADMIN] Announcement created: ${title}`);

        return NextResponse.json({ success: true, announcement });

    } catch (error: any) {
        console.error('Create announcement error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message?.includes('Unauthorized') ? 403 : 500 }
        );
    }
}
