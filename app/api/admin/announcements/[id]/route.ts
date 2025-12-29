import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, canManageAnnouncements } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const role = await requireAdmin();

        if (!canManageAnnouncements(role)) {
            return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();

        await prisma.announcement.update({
            where: { id },
            data: body
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Update announcement error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message?.includes('Unauthorized') ? 403 : 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const role = await requireAdmin();

        if (!canManageAnnouncements(role)) {
            return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
        }

        const { id } = await params;

        await prisma.announcement.delete({
            where: { id }
        });

        console.log(`[ADMIN] Announcement deleted: ${id}`);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Delete announcement error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message?.includes('Unauthorized') ? 403 : 500 }
        );
    }
}
