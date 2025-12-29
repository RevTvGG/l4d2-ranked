import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// DELETE /api/admin/medals/revoke?userId=...&medalId=...
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const medalId = searchParams.get('medalId');

        // @ts-expect-error - role is custom field
        if (!session?.user || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!userId || !medalId) {
            return NextResponse.json({ error: 'Missing userId or medalId' }, { status: 400 });
        }

        // Find user to get name for revalidation before deleting
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true }
        });

        const deleted = await prisma.userMedal.deleteMany({
            where: {
                userId: userId,
                medalId: medalId
            }
        });

        if (deleted.count === 0) {
            return NextResponse.json({ error: 'Medal not found on user' }, { status: 404 });
        }

        // Revalidate
        if (user?.name) {
            const encodedName = encodeURIComponent(user.name);
            revalidatePath(`/profile/${encodedName}`);
            revalidatePath('/admin/players');
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error revoking medal:', error);
        return NextResponse.json({ error: 'Failed to revoke medal' }, { status: 500 });
    }
}
