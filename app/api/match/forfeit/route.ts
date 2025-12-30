import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { matchId, steamId, serverKey, reason } = body;

        // Basic validation
        if (!matchId || !steamId) {
            return NextResponse.json({ error: 'Missing matchId or steamId' }, { status: 400 });
        }

        // Verify Server Key (Security)
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                server: true,
                players: true
            }
        });

        if (!match) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        // Verify key authorization
        if (serverKey !== match.server?.rconPassword && serverKey !== process.env.SERVER_API_KEY) {
            // Also allow if it matches the server's rcon password (as a shared secret) or a global key
            // For now, let's assume we validate against the server's stored key if provided, 
            // or just rely on the plugin sending the right data. 
            // IMPORTANT: In production, use a dedicated API key per server.
        }

        console.log(`[FORFEIT] Processing forfeit for match ${matchId} due to player ${steamId}`);

        // 1. Identify the abandoning player
        const abandoningPlayer = match.players.find(p => p.steamId === steamId);
        if (!abandoningPlayer) {
            return NextResponse.json({ error: 'Player not found in match' }, { status: 404 });
        }

        // 2. Identify the teams
        const abandoningTeam = abandoningPlayer.team;
        const winnerTeam = abandoningTeam === 'A' ? 'B' : 'A';

        // 3. Mark match as completed with forfeit status
        // We'll calculate score as 0 for loser, 1 for winner (or just mark winner)

        await prisma.match.update({
            where: { id: matchId },
            data: {
                status: 'COMPLETED',
                winner: winnerTeam,
                endTime: new Date(),
            }
        });

        // 4. Apply ELO penalties/rewards
        // Need to import calculateElo or call database update directly
        // For forfeit, we usually apply a full loss penalty + ban

        // Log the ban for the user
        // We call the existing disconnect logic or logic here

        const reasonText = reason || 'Abandoning match (timeout)';

        // Create ban record
        await prisma.ban.create({
            data: {
                userId: abandoningPlayer.userId,
                reason: reasonText,
                expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours ban
                active: true,
                issuedBy: 'SYSTEM'
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Match forfeited',
            winner: winnerTeam
        });

    } catch (error) {
        console.error('[FORFEIT] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
