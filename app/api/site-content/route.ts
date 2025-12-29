import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public API to fetch site content by key
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');

        if (!key) {
            return NextResponse.json({ success: false, error: 'Key is required' }, { status: 400 });
        }

        const content = await prisma.siteContent.findUnique({
            where: { key }
        });

        return NextResponse.json({
            success: true,
            content: content?.content || null
        });

    } catch (error: any) {
        console.error('Fetch site content error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
