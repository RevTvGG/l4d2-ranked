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

        // Trigger queue check to immediately maximize server usage
        const { checkQueueAndCreateMatch } = await import('./queue');
        // Run in background
        checkQueueAndCreateMatch().catch(err => console.error('Failed to trigger queue from admin:', err));

        revalidatePath('/admin/servers');
        return { success: true };
    } catch (error) {
        console.error('Failed to force release server:', error);
        return { error: 'Failed to release server' };
    }
}

export async function banUser(userId: string) {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['OWNER', 'ADMIN'].includes((session.user as any).role)) {
        return { error: 'Unauthorized' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { stripeSubscriptionId: true }
        });

        if (user?.stripeSubscriptionId) {
            const { stripe } = await import("@/lib/stripe");
            try {
                // Determine if we should cancel immediately or at period end.
                // For bans (cheating), we usually want to revoke access immediately.
                // However, canceling immediately might effectively mean "no refund, no service".
                await stripe.subscriptions.cancel(user.stripeSubscriptionId);
                console.log(`[BAN] Cancelled Stripe subscription for user ${userId}`);
            } catch (stripeError) {
                console.error(`[BAN] Failed to cancel subscription for ${userId}`, stripeError);
                // Continue with banning even if Stripe fails (we can fix manually)
            }
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                role: 'BANNED',
                isPremium: false, // Revoke premium immediately
                stripeSubscriptionId: null, // Clear subscription link
                stripeCurrentPeriodEnd: null
            }
        });

        return { success: true, message: "User banned and subscription cancelled." };

    } catch (error) {
        console.error("Failed to ban user:", error);
        return { error: "Failed to ban user" };
    }
}
