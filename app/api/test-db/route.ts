import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Test database connection
        const serverCount = await prisma.gameServer.count();

        return NextResponse.json({
            success: true,
            data: {
                connected: true,
                serverCount
            }
        });
    } catch (error: any) {
        console.error('Database test error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            code: 'DB_ERROR'
        }, { status: 500 });
    }
}
