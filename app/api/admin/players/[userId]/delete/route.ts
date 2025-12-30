import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/admin/players/[userId]/delete
export async function DELETE(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        // Only OWNER can delete users
        const admin = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        if (admin?.role !== 'OWNER') {
            return NextResponse.json({ success: false, error: 'Only OWNER can delete users' }, { status: 403 });
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: params.userId },
            select: { id: true, role: true, name: true }
        });

        if (!targetUser) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // Cannot delete OWNER
        if (targetUser.role === 'OWNER') {
            return NextResponse.json({ success: false, error: 'Cannot delete OWNER account' }, { status: 403 });
        }

        // Delete all related data first (cascade should handle most, but be explicit)
        await prisma.$transaction(async (tx) => {
            // Delete queue entries
            await tx.queueEntry.deleteMany({ where: { userId: params.userId } });

            // Delete match players (but keep match records)
            await tx.matchPlayer.deleteMany({ where: { userId: params.userId } });

            // Delete messages
            await tx.message.deleteMany({ where: { userId: params.userId } });

            // Delete map votes
            await tx.mapVote.deleteMany({ where: { userId: params.userId } });

            // Delete reports made by user
            await tx.report.deleteMany({ where: { userId: params.userId } });

            // Delete user reports
            await tx.userReport.deleteMany({
                where: { OR: [{ reporterId: params.userId }, { reportedId: params.userId }] }
            });

            // Delete chat mutes
            await tx.chatMute.deleteMany({ where: { userId: params.userId } });

            // Delete user medals
            await tx.userMedal.deleteMany({ where: { userId: params.userId } });

            // Delete invite codes used by this user (unlink)
            await tx.inviteCode.updateMany({
                where: { usedBy: params.userId },
                data: { usedBy: null, isUsed: false, usedAt: null }
            });

            // Delete accounts (OAuth)
            await tx.account.deleteMany({ where: { userId: params.userId } });

            // Delete sessions
            await tx.session.deleteMany({ where: { userId: params.userId } });

            // Finally delete the user
            await tx.user.delete({ where: { id: params.userId } });
        });

        console.log(`[ADMIN] User deleted: ${targetUser.name} (${params.userId}) by ${session.user.id}`);

        return NextResponse.json({
            success: true,
            message: `User ${targetUser.name} has been permanently deleted`
        });

    } catch (error) {
        console.error('Failed to delete user:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
    }
}
