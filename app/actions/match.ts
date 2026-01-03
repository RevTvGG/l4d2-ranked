'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Get match details
export async function getMatch(matchId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;

    return await prisma.match.findUnique({
        where: { id: matchId },
        include: {
            players: {
                include: {
                    user: true
                }
            },
            mapVotes: {
                include: {
                    user: true
                }
            },
            server: true,
            rounds: {
                orderBy: {
                    roundNumber: 'asc'
                }
            }
        }
    });
}

export async function acceptMatch(matchId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) return { error: "Not authenticated" };

    try {
        const player = await prisma.matchPlayer.findFirst({
            where: {
                matchId,
                userId: session.user.id
            }
        });

        if (!player) return { error: "Player not found in match" };

        await prisma.matchPlayer.update({
            where: { id: player.id },
            data: { accepted: true }
        });

        // Check if all players accepted
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: { players: true }
        });

        if (match && match.players.every((p: any) => p.accepted)) {
            await prisma.match.update({
                where: { id: matchId },
                data: { status: 'VETO' }
            });
        }

        revalidatePath('/play');
        return { success: true };
    } catch (error) {
        console.error("Error accepting match:", error);
        return { error: "Failed to accept match" };
    }
}

export async function voteMap(matchId: string, mapName: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) return { error: "Not authenticated" };

    try {
        // SECURITY CHECK: Verify user is a participant in this match
        const participant = await prisma.matchPlayer.count({
            where: {
                matchId,
                userId: session.user.id
            }
        });

        if (participant === 0) {
            return { error: "You are not a participant in this match" };
        }

        // Upsert vote
        await prisma.mapVote.upsert({
            where: {
                matchId_userId: {
                    matchId,
                    userId: session.user.id
                }
            },
            create: {
                matchId,
                userId: session.user.id,
                map: mapName
            },
            update: {
                map: mapName
            }
        });

        // Check for bots and auto-vote for them
        const matchPlayers = await prisma.matchPlayer.findMany({
            where: { matchId },
            include: { user: true }
        });

        const botPlayers = matchPlayers.filter(p => p.user.steamId?.startsWith('FAKE_BOT_'));

        if (botPlayers.length > 0) {
            console.log(`[VOTE] Auto-voting for ${botPlayers.length} bots...`);
            for (const bot of botPlayers) {
                await prisma.mapVote.upsert({
                    where: {
                        matchId_userId: {
                            matchId,
                            userId: bot.userId
                        }
                    },
                    create: {
                        matchId,
                        userId: bot.userId,
                        map: mapName // Bots follow leader
                    },
                    update: {
                        map: mapName
                    }
                });
            }
        }

        // CHECK: Did everyone vote?
        const totalVotes = await prisma.mapVote.count({
            where: { matchId }
        });

        // Assuming 8 players total
        if (totalVotes >= 8) {
            console.log('[VOTE] Voting complete. Tallying votes...');

            const votes = await prisma.mapVote.groupBy({
                by: ['map'],
                where: { matchId },
                _count: {
                    map: true
                },
                orderBy: {
                    _count: {
                        map: 'desc'
                    }
                },
                take: 1
            });

            const winnerMap = votes[0]?.map || 'Dark Carnival'; // Default fallback
            console.log('[VOTE] Winner Map:', winnerMap);

            await prisma.match.update({
                where: { id: matchId },
                data: {
                    status: 'READY', // Server is already assigned, now ready to join
                    mapName: winnerMap,
                    selectedMap: winnerMap
                }
            });

            // AUTO-TRIGGER: Start the server via RCON (Fire and forget)
            console.log('[VOTE] Auto-triggering server start (async)...');
            const baseUrl = process.env.NEXTAUTH_URL || (process.env.NODE_ENV === 'production' ? 'https://www.l4d2ranked.online' : 'http://localhost:3000');

            // Don't await this to prevent deadlock in dev environment (Server Action -> API Route)
            fetch(`${baseUrl}/api/server/start-match`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId })
            }).then(async (res) => {
                if (res.ok) {
                    console.log('[VOTE] Server start triggers successfully');
                } else {
                    const txt = await res.text();
                    console.error('[VOTE] Server start trigger failed:', txt);
                }
            }).catch(err => {
                console.error('[VOTE] Error triggering server start:', err);
            });
        }

        revalidatePath('/play');
        return { success: true };
    } catch (error) {
        console.error("Error voting map:", error);
        return { error: "Failed to submit vote" };
    }
}

export async function leaveMatch(matchId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) return { error: "Not authenticated" };

    try {
        console.log('[leaveMatch] Player attempting to leave match:', matchId, 'User:', session.user.id);

        // Get match status first
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            select: { status: true }
        });

        if (!match) {
            return { error: "Match not found" };
        }

        // CRITICAL: Only allow leaving during READY_CHECK phase
        // After VETO starts, leaving would break the match for everyone
        if (match.status !== 'READY_CHECK') {
            console.log('[leaveMatch] Cannot leave - match is already in', match.status);
            return { error: `Cannot leave match in ${match.status} phase` };
        }

        // Remove from MatchPlayer (only during READY_CHECK)
        await prisma.matchPlayer.deleteMany({
            where: {
                matchId,
                userId: session.user.id
            }
        });
        console.log('[leaveMatch] Removed from MatchPlayer');

        // Remove from Queue
        await prisma.queueEntry.deleteMany({
            where: {
                userId: session.user.id
            }
        });
        console.log('[leaveMatch] Removed from QueueEntry');

        // Cancel the match since we don't have 8 players anymore
        console.log('[leaveMatch] Cancelling match - player declined');
        await prisma.match.update({
            where: { id: matchId },
            data: {
                status: 'CANCELLED',
                cancelReason: 'Player declined match'
            }
        });

        // Return other players to queue
        await prisma.queueEntry.updateMany({
            where: { matchId },
            data: {
                status: 'WAITING',
                matchId: null
            }
        });
        console.log('[leaveMatch] Other players returned to queue');

        revalidatePath('/play');
        return { success: true };
    } catch (error) {
        console.error("Error leaving match:", error);
        return { error: "Failed to leave match" };
    }
}
