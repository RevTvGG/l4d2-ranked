import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

/**
 * ADMIN: Unban a player
 */
export async function POST(request: NextRequest) {
    // Check admin auth
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const { banId, userId } = await request.json();

        if (!banId && !userId) {
            return NextResponse.json(
                { error: 'Must provide either banId or userId' },
                { status: 400 }
            );
        }

        let result;

        if (banId) {
            // Unban specific ban
            result = await prisma.ban.update({
                where: { id: banId },
                data: { active: false }
            });
        } else {
            // Unban all active bans for user
            result = await prisma.ban.updateMany({
                where: {
                    userId,
                    active: true
                },
                data: { active: false }
            });
        }

        return NextResponse.json({
            success: true,
            message: banId ? 'Ban removed' : `All bans removed for user`,
            result
        });

    } catch (error) {
        console.error('[ADMIN] Unban error:', error);
        return NextResponse.json(
            { error: 'Failed to unban', details: String(error) },
            { status: 500 }
        );
    }
}
