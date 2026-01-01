import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Heartbeat endpoint to update user's lastSeen timestamp
export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        const steamId = (session as any)?.user?.steamId;

        if (!steamId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Update user's updatedAt timestamp
        await prisma.user.update({
            where: { steamId },
            data: {
                // updatedAt will be automatically updated by Prisma
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Heartbeat error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
