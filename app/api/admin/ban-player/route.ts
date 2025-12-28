import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAdminUser } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

/**
 * ADMIN: Ban a player
 * Simplified version using existing schema
 */
export async function POST(request: NextRequest) {
    // Check admin auth
    const authError = await requireAdmin();
    if (authError) return authError;

    const admin = await getAdminUser();

    try {
        const { userId, reason, duration } = await request.json();

        if (!userId || !reason) {
            return NextResponse.json(
                { error: 'Missing required fields: userId, reason' },
                { status: 400 }
            );
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Calculate expiration (duration in minutes)
        const durationMinutes = duration || 10080; // Default 1 week
        const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

        // Create ban
        const ban = await prisma.ban.create({
            data: {
                userId,
                reason: reason as any,
                duration: durationMinutes,
                expiresAt,
                active: true
            }
        });

        console.log(`[ADMIN] User ${user.name} banned by ${admin?.name}. Duration: ${durationMinutes} minutes`);

        return NextResponse.json({
            success: true,
            ban: {
                id: ban.id,
                user: user.name,
                duration: durationMinutes,
                expiresAt,
                reason
            }
        });

    } catch (error) {
        console.error('[ADMIN] Ban player error:', error);
        return NextResponse.json(
            { error: 'Failed to ban player', details: String(error) },
            { status: 500 }
        );
    }
}
