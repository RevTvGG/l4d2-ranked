import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/admin/players/[id]/delete
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // @ts-ignore - custom session field
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        // Only OWNER and ADMIN can delete users
        const admin = await prisma.user.findUnique({
            // @ts-ignore - custom session field
            where: { id: session.user.id },
            select: { role: true }
        });

        if (!admin || !['OWNER', 'ADMIN'].includes(admin.role)) {
            return NextResponse.json({ success: false, error: 'Only OWNER or ADMIN can delete users' }, { status: 403 });
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: params.id },
            select: { id: true, role: true, name: true }
        });

        if (!targetUser) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // Permission hierarchy:
        // - OWNER can delete anyone except other OWNERs
        // - ADMIN can delete regular users and moderators, but NOT other ADMINs or OWNERs
        if (targetUser.role === 'OWNER') {
            return NextResponse.json({ success: false, error: 'Cannot delete OWNER account' }, { status: 403 });
        }

        if (admin.role === 'ADMIN' && targetUser.role === 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Admins cannot delete other Admins' }, { status: 403 });
        }

        // Delete all related data first (cascade should handle most, but be explicit)
        await prisma.$transaction(async (tx) => {
            // Delete queue entries
            await tx.queueEntry.deleteMany({ where: { userId: params.id } });

            // Delete match players (but keep match records)
            await tx.matchPlayer.deleteMany({ where: { userId: params.id } });

            // Delete messages
            await tx.message.deleteMany({ where: { userId: params.id } });

            // Delete map votes
            await tx.mapVote.deleteMany({ where: { userId: params.id } });

            // Delete reports made by user
            await tx.report.deleteMany({ where: { userId: params.id } });

            // Delete user reports
            await tx.userReport.deleteMany({
                where: { OR: [{ reporterId: params.id }, { reportedId: params.id }] }
            });

            // Delete chat mutes
            await tx.chatMute.deleteMany({ where: { userId: params.id } });

            // Delete accounts (OAuth)
            await tx.account.deleteMany({ where: { userId: params.id } });

            // Delete sessions
            await tx.session.deleteMany({ where: { userId: params.id } });

            // Finally delete the user
            await tx.user.delete({ where: { id: params.id } });
        });

        // @ts-ignore - custom session field
        console.log(`[ADMIN] User deleted: ${targetUser.name} (${params.id}) by ${session.user.id}`);

        return NextResponse.json({
            success: true,
            message: `User ${targetUser.name} has been permanently deleted`
        });

    } catch (error) {
        console.error('Failed to delete user:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
    }
}
