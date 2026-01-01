import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        await requireAdmin();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'PENDING';

        const reports = await prisma.userReport.findMany({
            where: { status: status as any },
            include: {
                reporter: {
                    select: { name: true, steamId: true }
                },
                reported: {
                    select: { name: true, steamId: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, reports });

    } catch (error: any) {
        console.error('Fetch user reports error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message?.includes('Unauthorized') ? 403 : 500 }
        );
    }
}
