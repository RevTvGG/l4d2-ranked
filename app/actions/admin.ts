'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function forceReleaseServer(serverId: string) {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['OWNER', 'ADMIN'].includes((session.user as any).role)) {
        return { error: 'Unauthorized' };
    }

    try {
        await prisma.gameServer.update({
            where: { id: serverId },
            data: { status: 'AVAILABLE' }
        });

        // Also fix any stuck matches associated with this server
        // Cancel any matches that are supposedly IN_PROGRESS but the server is being force-released
        await prisma.match.updateMany({
            where: {
                serverId: serverId,
                status: { in: ['IN_PROGRESS', 'WAITING_FOR_PLAYERS'] }
            },
            data: {
                status: 'CANCELLED',
                cancelReason: 'Server force released by admin'
            }
        });

        revalidatePath('/admin/servers');
        return { success: true };
    } catch (error) {
        console.error('Failed to force release server:', error);
        return { error: 'Failed to release server' };
    }
}
