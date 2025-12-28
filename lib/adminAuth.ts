import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * Middleware to check if user is admin
 * Use this in admin API routes
 */
export async function requireAdmin() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
        );
    }

    // Check if user is admin
    if (!(session.user as any).isAdmin) {
        return NextResponse.json(
            { error: 'Forbidden - Admin access required' },
            { status: 403 }
        );
    }

    return null; // No error, user is admin
}

/**
 * Get current admin user
 */
export async function getAdminUser() {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).isAdmin) {
        return null;
    }

    return session.user;
}
