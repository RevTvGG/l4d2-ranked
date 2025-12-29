import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';

// Role hierarchy: OWNER > ADMIN > MODERATOR > USER
export const ADMIN_ROLES = ['OWNER', 'ADMIN', 'MODERATOR'] as const;
export type AdminRole = typeof ADMIN_ROLES[number];

export async function isAdmin(): Promise<boolean> {
    const session = await getServerSession(authOptions);
    if (!session?.user) return false;

    // @ts-expect-error - custom field
    const userId = session.user.id;
    if (!userId) return false;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    });

    return user?.role ? ADMIN_ROLES.includes(user.role as AdminRole) : false;
}

export async function getAdminRole(): Promise<string | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;

    // @ts-expect-error - custom field
    const userId = session.user.id;
    if (!userId) return null;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    });

    if (user?.role && ADMIN_ROLES.includes(user.role as AdminRole)) {
        return user.role;
    }

    return null;
}

export async function requireAdmin() {
    const role = await getAdminRole();
    if (!role) {
        throw new Error('Unauthorized: Admin access required');
    }
    return role;
}

export async function requireOwner() {
    const role = await getAdminRole();
    if (role !== 'OWNER') {
        throw new Error('Unauthorized: Owner access required');
    }
    return role;
}

export function canManageRoles(role: string): boolean {
    return role === 'OWNER';
}

export function canBanPlayers(role: string): boolean {
    return ['OWNER', 'ADMIN', 'MODERATOR'].includes(role);
}

export function canManageAnnouncements(role: string): boolean {
    return ['OWNER', 'ADMIN'].includes(role);
}

export function canEditContent(role: string): boolean {
    return ['OWNER', 'ADMIN'].includes(role);
}

export function canModerateChat(role: string): boolean {
    return ['OWNER', 'ADMIN', 'MODERATOR'].includes(role);
}
