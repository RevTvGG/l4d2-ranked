'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
                mapName
            },
            update: {
                mapName
            }
        });

        revalidatePath('/play');
        return { success: true };
    } catch (error) {
        console.error("Error voting map:", error);
        return { error: "Failed to submit vote" };
    }
}
