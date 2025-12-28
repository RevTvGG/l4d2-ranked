import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { verifyServerKey } from '@/lib/serverAuth';
import { successResponse, errorResponse, validationError, unauthorizedResponse } from '../../../../lib/api-response';

const requestSchema = z.object({
    server_key: z.string().min(1),
    match_id: z.string().min(1)
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parseResult = requestSchema.safeParse(body);

        if (!parseResult.success) {
            return validationError(parseResult.error);
        }

        const { server_key, match_id } = parseResult.data;

        // 1. Verify Server
        const server = await verifyServerKey(server_key);
        if (!server) return unauthorizedResponse();

        // 2. Find Match
        const match = await prisma.match.findUnique({
            where: { id: match_id }
        });

        if (!match) return errorResponse('Match not found', 'MATCH_NOT_FOUND', 404);

        // 3. Update Match Status to IN_PROGRESS
        await prisma.match.update({
            where: { id: match_id },
            data: {
                status: 'IN_PROGRESS',
                startedAt: new Date()
            }
        });

        console.log(`[API] Match ${match_id} is now LIVE (IN_PROGRESS)`);

        return successResponse({ message: 'Match marked as live' });

    } catch (error) {
        console.error('[API] /server/notify-live failed:', error);
        return errorResponse('Internal Server Error', 'INTERNAL_ERROR', 500);
    }
}
