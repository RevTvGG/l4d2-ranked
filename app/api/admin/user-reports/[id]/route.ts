import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin();

        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (!['PENDING', 'REVIEWED', 'ACTION_TAKEN', 'DISMISSED'].includes(status)) {
            return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
        }

        await prisma.userReport.update({
            where: { id },
            data: { status: status as any }
        });

        console.log(`[ADMIN] UserReport ${id} status changed to ${status}`);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Update user report error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message?.includes('Unauthorized') ? 403 : 500 }
        );
    }
}
