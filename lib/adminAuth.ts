import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Hardcoded admin Steam IDs
const ADMIN_STEAM_IDS = [
    '76561198113376372', // Revv (you)
];

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

    // Check if user's Steam ID is in admin list
    const userSteamId = (session.user as any).steamId;
    if (!ADMIN_STEAM_IDS.includes(userSteamId)) {
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

    if (!session?.user) {
        return null;
    }

    const userSteamId = (session.user as any).steamId;
    if (!ADMIN_STEAM_IDS.includes(userSteamId)) {
        return null;
    }

    return session.user;
}

/**
 * Check if a user is admin (for client-side use)
 */
export function isAdmin(steamId: string): boolean {
    return ADMIN_STEAM_IDS.includes(steamId);
}
