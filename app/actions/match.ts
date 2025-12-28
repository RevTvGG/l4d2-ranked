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
    if (!session?.user) return { error: "Not authenticated" };

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
    if (!session?.user) return { error: "Not authenticated" };

    try {
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

        const botPlayers = matchPlayers.filter(p => p.user.steamId.startsWith('FAKE_BOT_'));

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
                    status: 'WAITING_FOR_SERVER', // Next step: configure server
                    mapName: winnerMap
                }
            });

            // Trigger server configuration (optional hook here or handled by cron/polling)
            // For now, let's assume external worker or next step picks it up.
            // Or better: Call server RCON immediately if possible.
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
    if (!session?.user) return { error: "Not authenticated" };

    try {
        // Remove from MatchPlayer
        await prisma.matchPlayer.deleteMany({
            where: {
                matchId,
                userId: session.user.id
            }
        });

        // Remove from Queue (if linked)
        await prisma.queueEntry.deleteMany({
            where: {
                userId: session.user.id
            }
        });

        revalidatePath('/play');
        return { success: true };
    } catch (error) {
        console.error("Error leaving match:", error);
        return { error: "Failed to leave match" };
    }
}
