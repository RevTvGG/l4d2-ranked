import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

/**
 * ADMIN: Get all active bans
 */
export async function GET(request: NextRequest) {
    // Check admin auth
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('active') !== 'false';

        const bans = await prisma.ban.findMany({
            where: activeOnly ? { active: true } : undefined,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        steamId: true,
                        image: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            success: true,
            bans,
            total: bans.length
        });

    } catch (error) {
        console.error('[ADMIN] Get bans error:', error);
        return NextResponse.json(
            { error: 'Failed to get bans', details: String(error) },
            { status: 500 }
        );
    }
}
