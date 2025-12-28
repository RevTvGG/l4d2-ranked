import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

/**
 * ADMIN: Get all players with stats and ban info
 */
export async function GET(request: NextRequest) {
    // Check admin auth
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const limit = parseInt(searchParams.get('limit') || '50');

        const players = await prisma.user.findMany({
            where: search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { steamId: { contains: search } }
                ]
            } : undefined,
            select: {
                id: true,
                name: true,
                steamId: true,
                image: true,
                rating: true,
                wins: true,
                losses: true,
                winRate: true,
                banCount: true,
                createdAt: true,
                bans: {
                    where: { active: true },
                    select: {
                        id: true,
                        type: true,
                        reason: true,
                        expiresAt: true
                    }
                }
            },
            orderBy: { rating: 'desc' },
            take: limit
        });

        return NextResponse.json({
            success: true,
            players,
            total: players.length
        });

    } catch (error) {
        console.error('[ADMIN] Get players error:', error);
        return NextResponse.json(
            { error: 'Failed to get players', details: String(error) },
            { status: 500 }
        );
    }
}
