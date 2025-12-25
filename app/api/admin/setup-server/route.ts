import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const server = await prisma.gameServer.upsert({
            where: { serverKey: 'ranked-server-k9cc0n0k4rc' },
            update: {
                name: 'L4D2 Ranked Server #1',
                ipAddress: '50.20.249.93',
                port: 9190,
                rconPassword: 'server1rankedonlinexx26',
                rconPort: 9190,
                isActive: true,
                status: 'AVAILABLE',
            },
            create: {
                name: 'L4D2 Ranked Server #1',
                ipAddress: '50.20.249.93',
                port: 9190,
                rconPassword: 'server1rankedonlinexx26',
                rconPort: 9190,
                serverKey: 'ranked-server-k9cc0n0k4rc',
                isActive: true,
                status: 'AVAILABLE',
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Server added/updated successfully',
            server: {
                id: server.id,
                name: server.name,
                ipAddress: server.ipAddress,
                port: server.port,
                rconPort: server.rconPort,
                status: server.status,
            },
        });
    } catch (error) {
        console.error('[Setup Server] Error:', error);
        return NextResponse.json(
            { error: 'Failed to setup server', details: String(error) },
            { status: 500 }
        );
    }
}
