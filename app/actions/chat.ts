'use server'


import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function sendMessage(content: string) {
    const session = await getServerSession(authOptions);
    const { prisma } = await import("@/lib/prisma");

    // STRICT SECURITY CHECK:
    // Ensure user is authenticated specifically with our Steam provider.
    // We do NOT rely on client-side checks.
    const steamId = (session as any)?.user?.steamId;

    if (!steamId) {
        return { error: "Not authenticated" };
    }

    // Find User ID from Steam ID to ensure they are a valid registered user
    const user = await prisma.user.findUnique({
        where: { steamId: steamId }
    });

    if (!user) return { error: "User checking failed" };



    if (!content.trim()) return { error: "Empty message" };

    // Anti-Spam: Check if user sent a message in the last 3 seconds
    const lastMessage = await prisma.message.findFirst({
        where: {
            userId: user.id,
            createdAt: {
                gt: new Date(Date.now() - 3000)
            }
        }
    });

    if (lastMessage) {
        return { error: "Please wait 3 seconds before sending another message." };
    }

    try {
        const message = await prisma.message.create({
            data: {
                content: content.replace(/<[^>]*>?/gm, '').trim().slice(0, 500), // Sanitize HTML and limit length
                userId: user.id
            },
            include: {
                user: {
                    select: {
                        name: true,
                        image: true,
                        rank: true,
                        isPremium: true,
                        profileTheme: true,
                        nameGradient: true,
                        customFont: true,
                        profileGlow: true
                    }
                }
            }
        });
        return { success: true, message };
    } catch (e) {
        console.error("Chat Error:", e);
        return { error: "Failed to send" };
    }
}

export async function getMessages() {
    try {
        const { prisma } = await import("@/lib/prisma");
        const messages = await prisma.message.findMany({
            take: 50,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        name: true,
                        image: true,
                        rank: true,
                        isPremium: true,
                        profileTheme: true,
                        nameGradient: true,
                        customFont: true,
                        profileGlow: true
                    }
                }
            }
        });
        // Reverse to show oldest first in the chat log (bottom-up feel) but fetch newest.
        return messages.reverse();
    } catch (e) {
        return [];
    }
}

// Fetch users active in the last 5 minutes (truly online)
export async function getOnlineUsers() {
    try {
        const { prisma } = await import("@/lib/prisma");

        // Only show users who were active in the last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const users = await prisma.user.findMany({
            where: {
                updatedAt: {
                    gte: fiveMinutesAgo
                }
            },
            take: 50,
            orderBy: {
                updatedAt: 'desc'
            },
            select: {
                name: true,
                image: true,
                isPremium: true
            }
        });
        return users;
    } catch (e) {
        return [];
    }
}
