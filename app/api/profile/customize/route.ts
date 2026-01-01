import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Update any premium customization field
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const steamId = (session as any)?.user?.steamId;

        if (!steamId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

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

        const body = await request.json();

        // Allowed fields to update
        const allowedFields = [
            'customFont',
            'profileFrame',
            'customTitle',
            'nameGradient',
            'profileGlow',
            'profileColor',
            'profileBanner',
        ];

        // Build update data with validation
        const updateData: Record<string, any> = {};

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                let value = body[field];

                // Validation
                if (field === 'customTitle') {
                    // Limit to 10 characters
                    value = String(value).slice(0, 10);
                }

                if (field === 'profileGlow') {
                    value = Boolean(value);
                }

                updateData[field] = value;
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: updateData
        });

        return NextResponse.json({ success: true, updated: Object.keys(updateData) });
    } catch (error) {
        console.error('Customize error:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
