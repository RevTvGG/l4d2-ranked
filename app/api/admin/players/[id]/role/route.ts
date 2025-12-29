import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

const VALID_ROLES = ['Newcomer', 'MODERATOR', 'ADMIN'];

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Only owner can change roles
        await requireOwner();

        const { id } = await params;
        const body = await request.json();
        const { role } = body;

        if (!role || !VALID_ROLES.includes(role)) {
            return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 });
        }

        // Check target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id },
            select: { role: true, name: true }
        });

        if (!targetUser) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // Cannot change owner's role
        if (targetUser.role === 'OWNER') {
            return NextResponse.json({ success: false, error: 'Cannot change owner role' }, { status: 403 });
        }

        // Update role
        await prisma.user.update({
            where: { id },
            data: { role }
        });

        console.log(`[ADMIN] User ${id} (${targetUser.name}) role changed to ${role}`);

        return NextResponse.json({ success: true, message: 'Role updated successfully' });

    } catch (error: any) {
        console.error('Role change error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: error.message?.includes('Unauthorized') ? 403 : 500 }
        );
    }
}
