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

        const body = await request.json();

        // Fields that require premium
        const premiumFields = [
            'customFont',
            'profileFrame',
            'customTitle',
            'nameGradient',
            'profileGlow',
            'profileColor',
            'profileBanner',
            'premiumIcon',
            'profileWallpaper',
        ];

        // Fields available to all users
        const publicFields = [
            'playstylePublic',
        ];

        // Build update data with validation
        const updateData: Record<string, any> = {};

        // Handle premium fields
        for (const field of premiumFields) {
            if (body[field] !== undefined) {
                if (!user.isPremium) {
                    return NextResponse.json({ error: 'Premium required for this field' }, { status: 403 });
                }

                let value = body[field];

                // Validation
                if (field === 'customTitle') {
                    value = String(value).slice(0, 10);
                }

                if (field === 'profileGlow') {
                    value = Boolean(value);
                }

                if (field === 'profileWallpaper') {
                    // Validate wallhaven.cc URL or allow empty string to clear
                    if (value && typeof value === 'string' && value.trim() !== '') {
                        const url = value.trim();
                        const validDomains = [
                            'wallhaven.cc',
                            'w.wallhaven.cc',
                            'th.wallhaven.cc'
                        ];

                        try {
                            const parsedUrl = new URL(url);
                            const isValidDomain = validDomains.some(domain =>
                                parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
                            );

                            if (!isValidDomain) {
                                return NextResponse.json({
                                    error: 'Invalid wallpaper URL. Only wallhaven.cc URLs are allowed.'
                                }, { status: 400 });
                            }

                            value = url;
                        } catch (e) {
                            return NextResponse.json({
                                error: 'Invalid URL format'
                            }, { status: 400 });
                        }
                    } else {
                        // Allow empty string to clear wallpaper
                        value = null;
                    }
                }

                updateData[field] = value;
            }
        }

        // Handle public fields (no premium required)
        for (const field of publicFields) {
            if (body[field] !== undefined) {
                let value = body[field];

                if (field === 'playstylePublic') {
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

