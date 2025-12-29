import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        await requireAdmin();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';

        const players = await prisma.user.findMany({
            where: search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { steamId: { contains: search } }
                ]
            } : {},
            select: {
                id: true,
                name: true,
                steamId: true,
                image: true,
                role: true,
                rating: true,
                wins: true,
                losses: true,
                banCount: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return NextResponse.json({ success: true, players });

    } catch (error: any) {
        console.error('Admin players error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: error.message?.includes('Unauthorized') ? 403 : 500 }
        );
    }
}
