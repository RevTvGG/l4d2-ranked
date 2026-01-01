import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isValidTheme } from '@/lib/themes';

// Update user's profile theme (premium only)
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const steamId = (session as any)?.user?.steamId;

        if (!steamId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Get user to check if premium
        const user = await prisma.user.findUnique({
            where: { steamId },
            select: { id: true, isPremium: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.isPremium) {
            return NextResponse.json({ error: 'Premium required' }, { status: 403 });
        }

        const { theme } = await request.json();

        if (!theme || !isValidTheme(theme)) {
            return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
        }

        // Update user's theme
        await prisma.user.update({
            where: { id: user.id },
            data: { profileTheme: theme }
        });

        return NextResponse.json({ success: true, theme });
    } catch (error) {
        console.error('Theme update error:', error);
        return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 });
    }
}
