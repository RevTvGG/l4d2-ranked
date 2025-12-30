import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        await requireAdmin();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';

        const users = await prisma.user.findMany({
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
                isPremium: true,
                createdAt: true,
                bans: {
                    where: {
                        active: true,
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gt: new Date() } }
                        ]
                    },
                    take: 1,
                    select: { id: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        const players = users.map(user => ({
            ...user,
            activeBanId: user.bans[0]?.id || null,
            bans: undefined // Remove raw bans array from response
        }));

        return NextResponse.json({ success: true, players });

    } catch (error: any) {
        console.error('Admin players error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: error.message?.includes('Unauthorized') ? 403 : 500 }
        );
    }
}
