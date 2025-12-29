import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/admin/medals/[id] - Update medal
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // @ts-expect-error - role is custom field
        if (!session?.user || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, icon, color, rarity } = body;

        const medal = await prisma.medal.update({
            where: { id: params.id },
            data: {
                ...(name && { name }),
                ...(description && { description }),
                ...(icon && { icon }),
                ...(color && { color }),
                ...(rarity && { rarity })
            }
        });

        return NextResponse.json({ success: true, medal });
    } catch (error) {
        console.error('Error updating medal:', error);
        return NextResponse.json({ error: 'Failed to update medal' }, { status: 500 });
    }
}

// DELETE /api/admin/medals/[id] - Delete medal
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // @ts-expect-error - role is custom field
        if (!session?.user || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.medal.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting medal:', error);
        return NextResponse.json({ error: 'Failed to delete medal' }, { status: 500 });
    }
}
