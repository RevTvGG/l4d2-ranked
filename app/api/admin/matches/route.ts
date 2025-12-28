import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

/**
 * ADMIN: Get all matches with filters
 */
export async function GET(request: NextRequest) {
    // Check admin auth
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '20');

        const matches = await prisma.match.findMany({
            where: status ? { status: status as any } : undefined,
            include: {
                players: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                steamId: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return NextResponse.json({
            success: true,
            matches,
            total: matches.length
        });

    } catch (error) {
        console.error('[ADMIN] Get matches error:', error);
        return NextResponse.json(
            { error: 'Failed to get matches', details: String(error) },
            { status: 500 }
        );
    }
}
