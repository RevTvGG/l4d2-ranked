import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        await requireAdmin();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'OPEN';

        const reports = await prisma.report.findMany({
            where: { status },
            include: {
                user: {
                    select: { name: true, steamId: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, reports });

    } catch (error: any) {
        console.error('Fetch reports error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message?.includes('Unauthorized') ? 403 : 500 }
        );
    }
}
