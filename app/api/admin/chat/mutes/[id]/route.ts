import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin();

        const { id } = await params;

        await prisma.chatMute.delete({
            where: { id }
        });

        console.log(`[ADMIN] Mute ${id} removed`);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Unmute error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message?.includes('Unauthorized') ? 403 : 500 }
        );
    }
}
