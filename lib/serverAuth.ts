import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Verify server authentication key
 */
export async function verifyServerKey(serverKey: string) {
    if (!serverKey) {
        return null;
    }

    const server = await prisma.gameServer.findUnique({
        where: { serverKey }
    });

    if (!server || !server.isActive) {
        return null;
    }

    return server;
}

/**
 * Middleware to authenticate game server requests
 */
export async function authenticateServer(request: NextRequest) {
    const serverKey = request.headers.get('X-Server-Key') ||
        (await request.json()).serverKey;

    const server = await verifyServerKey(serverKey);

    if (!server) {
        return NextResponse.json(
            { success: false, error: 'Invalid server key', code: 'UNAUTHORIZED' },
            { status: 401 }
        );
    }

    return server;
}

/**
 * Standard error response
 */
export function errorResponse(
    message: string,
    code: string,
    status: number = 400
) {
    return NextResponse.json(
        { success: false, error: message, code },
        { status }
    );
}

/**
 * Standard success response
 */
export function successResponse(data: any) {
    return NextResponse.json({
        success: true,
        ...data
    });
}
