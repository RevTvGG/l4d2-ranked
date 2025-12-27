import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTestAuth } from '@/lib/testAuth';

export async function POST(request: NextRequest) {
    // Verificar autenticación
    const authError = requireTestAuth(request);
    if (authError) return authError;

    try {
        // Delete test queue entries
        const queueDeleted = await prisma.queueEntry.deleteMany({
            where: {
                user: {
                    steamId: {
                        startsWith: 'STEAM_1:0:100'
                    }
                }
            }
        });

        // Delete test matches
        const matchesDeleted = await prisma.match.deleteMany({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                },
                status: {
                    in: ['READY_CHECK', 'VETO', 'READY', 'IN_PROGRESS']
                }
            }
        });

        return NextResponse.json({
            success: true,
            queueEntriesDeleted: queueDeleted.count,
            matchesDeleted: matchesDeleted.count
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
