
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
    try {
        // 1. Reset all servers to AVAILABLE
        await prisma.gameServer.updateMany({
            data: {
                status: 'AVAILABLE',
                isActive: true
            }
        });

        // 2. Clear Queue (First because it references matches)
        await prisma.queueEntry.deleteMany({});

        // 3. Clear stale matches (status != FINISHED)
        await prisma.match.deleteMany({
            where: {
                status: { not: 'FINISHED' }
            }
        });

        // 4. Delete fake bots
        await prisma.user.deleteMany({
            where: {
                steamId: { startsWith: 'FAKE_BOT_' }
            }
        });

        return NextResponse.json({ success: true, message: 'System reset successfully' });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
