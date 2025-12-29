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

        if (!['OPEN', 'REVIEWING', 'CLOSED'].includes(status)) {
            return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
        }

        await prisma.report.update({
            where: { id },
            data: { status }
        });

        console.log(`[ADMIN] Report ${id} status changed to ${status}`);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Update report error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message?.includes('Unauthorized') ? 403 : 500 }
        );
    }
}
