import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAdminUser } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

/**
 * ADMIN: Ban a player
 * Supports: GAME, CHAT, or BOTH bans
 * Supports: Temporary (with duration) or Permanent (null duration)
 */
export async function POST(request: NextRequest) {
    // Check admin auth
    const authError = await requireAdmin();
    if (authError) return authError;

    const admin = await getAdminUser();

    try {
        const { userId, reason, type, duration } = await request.json();

        if (!userId || !reason || !type) {
            return NextResponse.json(
                { error: 'Missing required fields: userId, reason, type' },
                { status: 400 }
            );
        }

        // Validate ban type
        if (!['GAME', 'CHAT', 'BOTH'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid ban type. Must be GAME, CHAT, or BOTH' },
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

        // Calculate expiration
        let expiresAt = null;
        if (duration && duration > 0) {
            expiresAt = new Date(Date.now() + duration * 60 * 1000); // duration in minutes
        }

        // Create ban
        const ban = await prisma.ban.create({
            data: {
                userId,
                reason: reason as any, // Will use existing BanReason enum
                type: type as any,
                duration: duration || null,
                bannedBy: admin?.id || null,
                expiresAt,
                active: true
            }
        });

        console.log(`[ADMIN] User ${user.name} banned by ${admin?.name}. Type: ${type}, Duration: ${duration || 'PERMANENT'}`);

        return NextResponse.json({
            success: true,
            ban: {
                id: ban.id,
                user: user.name,
                type,
                duration: duration || 'PERMANENT',
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
