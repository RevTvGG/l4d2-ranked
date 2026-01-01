import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Admin endpoint to make yourself premium
export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        const steamId = (session as any)?.user?.steamId;

        if (!steamId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { steamId },
            select: { id: true, role: true, name: true, isPremium: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Only OWNER can use this endpoint
        if (user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Update user to premium
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isPremium: true,
                premiumSince: user.isPremium ? undefined : new Date()
            }
        });

        return NextResponse.json({
            success: true,
            message: `${user.name} is now premium!`,
            wasPremium: user.isPremium
        });
    } catch (error) {
        console.error('Make premium error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
