import { NextRequest, NextResponse } from 'next/server';
<parameter name="requireAdmin } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

/**
 * ADMIN: Get full queue details
 */
export async function GET(request: NextRequest) {
    // Check admin auth
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const queue = await prisma.queueEntry.findMany({
            where: { status: 'WAITING' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        steamId: true,
                        image: true,
                        rating: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json({
            success: true,
            queue,
            total: queue.length
        });

    } catch (error) {
        console.error('[ADMIN] Get queue error:', error);
        return NextResponse.json(
            { error: 'Failed to get queue', details: String(error) },
            { status: 500 }
        );
    }
}

/**
 * ADMIN: Clear entire queue
 */
export async function DELETE(request: NextRequest) {
    // Check admin auth
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const result = await prisma.queueEntry.deleteMany({
            where: { status: 'WAITING' }
        });

        console.log(`[ADMIN] Cleared queue: ${result.count} entries removed`);

        return NextResponse.json({
            success: true,
            message: `Cleared ${result.count} queue entries`
        });

    } catch (error) {
        console.error('[ADMIN] Clear queue error:', error);
        return NextResponse.json(
            { error: 'Failed to clear queue', details: String(error) },
            { status: 500 }
        );
    }
}
