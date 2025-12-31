
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { verifyServerKey } from '@/lib/serverAuth';
import { successResponse, errorResponse, validationError, unauthorizedResponse } from '../../../../lib/api-response';

export const dynamic = 'force-dynamic';

// Strict input schema
const requestSchema = z.object({
    server_key: z.string().min(1)
});

/**
 * POST /api/server/check-match
 * Strictly JSON only. No FormData fallback.
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Validate Content-Type
        if (!request.headers.get('content-type')?.includes('application/json')) {
            return errorResponse('Content-Type must be application/json', 'INVALID_CONTENT_TYPE', 400);
        }

        // 2. Parse & Validate Body
        let body;
        try {
            body = await request.json();
        } catch {
            return errorResponse('Invalid JSON body', 'INVALID_JSON', 400);
        }

        const parseResult = requestSchema.safeParse(body);
        if (!parseResult.success) {
            return validationError(parseResult.error);
        }

        const { server_key } = parseResult.data;

        // 3. Verify Server Auth
        const server = await verifyServerKey(server_key);
        if (!server) {
            return unauthorizedResponse();
        }

        // 4. Logic: Find READY Match
        const match = await prisma.match.findFirst({
            where: {
                serverId: server.id,
                status: 'READY'
            },
            include: {
                players: {
                    include: {
                        user: { select: { steamId: true, name: true, rating: true } }
                    }
                }
            }
        });

        // 5. Success Response (Even if no match)
        if (!match) {
            return successResponse({
                match_id: null
            });
        }

        // 6. Format Match Data
        const teams = {
            A: match.players.filter(p => p.team === 1).map(p => ({
                steam_id: p.user.steamId,
                name: p.user.name,
                mmr: p.user.rating
            })),
            B: match.players.filter(p => p.team === 2).map(p => ({
                steam_id: p.user.steamId,
                name: p.user.name,
                mmr: p.user.rating
            }))
        };

        return successResponse({
            match_id: match.id,
            map: match.mapName || 'c1m1_hotel',
            teams
        });

    } catch (error) {
        console.error('[API] /server/check-match failed:', error);
        return errorResponse('Internal Server Error', 'INTERNAL_ERROR', 500);
    }
}
