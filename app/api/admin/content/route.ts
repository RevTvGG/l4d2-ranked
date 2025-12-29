import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, canEditContent } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        await requireAdmin();

        const contents = await prisma.siteContent.findMany({
            orderBy: { key: 'asc' }
        });

        return NextResponse.json({ success: true, contents });

    } catch (error: any) {
        console.error('Fetch content error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message?.includes('Unauthorized') ? 403 : 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const role = await requireAdmin();

        if (!canEditContent(role)) {
            return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();
        const { key, content } = body;

        if (!key) {
            return NextResponse.json({ success: false, error: 'Key is required' }, { status: 400 });
        }

        const result = await prisma.siteContent.upsert({
            where: { key },
            update: { content: content || '' },
            create: { key, content: content || '' }
        });

        console.log(`[ADMIN] Content updated: ${key}`);

        return NextResponse.json({ success: true, content: result });

    } catch (error: any) {
        console.error('Update content error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message?.includes('Unauthorized') ? 403 : 500 }
        );
    }
}
