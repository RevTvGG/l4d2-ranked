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

        revalidatePath('/play');
        return { success: true };
    } catch (error) {
        console.error("Error voting map:", error);
        return { error: "Failed to submit vote" };
    }
}
