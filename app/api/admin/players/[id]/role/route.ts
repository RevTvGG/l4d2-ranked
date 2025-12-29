import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

const VALID_ROLES = ['Newcomer', 'MODERATOR', 'ADMIN'];

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUserRole = await getAdminRole();

        // Only Owner and Admin can change roles
        if (!currentUserRole || !['OWNER', 'ADMIN'].includes(currentUserRole)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { role } = body;

        if (!role || !VALID_ROLES.includes(role)) {
            return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 });
        }

        // Logic Check: Admins cannot promote to Admin
        if (currentUserRole === 'ADMIN' && role === 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Admins cannot promote users to Admin. Only Owner can.' }, { status: 403 });
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

        // Logic Check: Admins cannot demote other Admins
        if (currentUserRole === 'ADMIN' && targetUser.role === 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Admins cannot modify other Admins.' }, { status: 403 });
        }

        // Update role
        await prisma.user.update({
            where: { id },
            data: { role }
        });

        console.log(`[ADMIN] User ${id} (${targetUser.name}) role changed to ${role} by ${currentUserRole}`);

        return NextResponse.json({ success: true, message: 'Role updated successfully' });

    } catch (error: any) {
        console.error('Role change error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: error.message?.includes('Unauthorized') ? 403 : 500 }
        );
    }
}
