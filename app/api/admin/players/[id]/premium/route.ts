'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * PATCH /api/admin/players/[id]/premium
 * Toggle premium status for a user (OWNER only)
 */
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // Only OWNER can toggle premium
        const session = await getServerSession(authOptions);
        // @ts-expect-error - role is custom field
        if (!session?.user || session.user.role !== 'OWNER') {
            return NextResponse.json(
                { success: false, error: 'Only the owner can toggle premium status' },
                { status: 403 }
            );
        }

        const { id } = await context.params;
        const body = await request.json();
        const { isPremium, expiresInDays } = body;

        // Validate input
        if (typeof isPremium !== 'boolean') {
            return NextResponse.json(
                { success: false, error: 'isPremium must be a boolean' },
                { status: 400 }
            );
        }

        // Calculate premium expiration if enabling
        let premiumExpiresAt: Date | null = null;
        let premiumSince: Date | null = null;

        if (isPremium) {
            premiumSince = new Date();
            if (expiresInDays && expiresInDays > 0) {
                premiumExpiresAt = new Date();
                premiumExpiresAt.setDate(premiumExpiresAt.getDate() + expiresInDays);
            }
            // If no expiresInDays, premium is permanent (null expiration)
        }

        // Update user
        const user = await prisma.user.update({
            where: { id },
            data: {
                isPremium,
                premiumSince: isPremium ? premiumSince : null,
                premiumExpiresAt: isPremium ? premiumExpiresAt : null
            },
            select: {
                id: true,
                name: true,
                isPremium: true,
                premiumSince: true,
                premiumExpiresAt: true
            }
        });

        return NextResponse.json({
            success: true,
            message: isPremium
                ? `Premium enabled for ${user.name}${premiumExpiresAt ? ` (expires ${premiumExpiresAt.toLocaleDateString()})` : ' (permanent)'}`
                : `Premium disabled for ${user.name}`,
            user
        });

    } catch (error) {
        console.error('[API] Premium toggle failed:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update premium status' },
            { status: 500 }
        );
    }
}
