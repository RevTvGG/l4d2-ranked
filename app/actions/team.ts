'use server'


import { revalidatePath } from "next/cache"

// Mock Payment Validation
async function simulatePaymentProcess() {
    // In a real app, this would verify Stripe/PayPal transaction
    await new Promise(resolve => setTimeout(resolve, 1500)); // Fake processing delay
    return true;
}

export async function createTeam(formData: FormData) {
    const ownerSteamId = formData.get("ownerSteamId") as string;
    const name = formData.get("name") as string;
    const tag = formData.get("tag") as string;
    const logoUrl = formData.get("logoUrl") as string;
    const countryCode = formData.get("countryCode") as string;

    if (!ownerSteamId || !name || !tag) {
        return { success: false, message: "Missing required fields." };
    }

    // 2. Mock Payment Check ($5.00)
    const paymentSuccess = await simulatePaymentProcess();
    if (!paymentSuccess) {
        return { success: false, message: "Payment failed." };
    }

    try {
        const { prisma } = await import("@/lib/prisma");

        // 3. Verify User exists and has no team
        const user = await prisma.user.findUnique({
            where: { steamId: ownerSteamId }
        });

        if (!user) return { success: false, message: "User not found." };
        if (user.teamId) return { success: false, message: "You are already in a team." };

        // 4. Create Team
        // Use a transaction to create team AND update user
        await prisma.$transaction(async (tx) => {
            const team = await tx.team.create({
                data: {
                    name,
                    tag,
                    logoUrl: logoUrl || null,
                    countryCodes: countryCode || null,
                    ownerId: ownerSteamId,
                    members: {
                        connect: { id: user.id }
                    }
                }
            });
        });

        revalidatePath('/teams');
        revalidatePath('/leaderboard');
        return { success: true, message: "Team created successfully!" };

    } catch (error: any) {
        console.error("Create Team Error:", error);
        if (error.code === 'P2002') {
            return { success: false, message: "Team name or tag already taken." };
        }
        return { success: false, message: "Internal server error." };
    }
}

export async function leaveTeam(steamId: string) {
    if (!steamId) return { success: false, message: "Invalid user." };

    try {
        const { prisma } = await import("@/lib/prisma");
        const user = await prisma.user.findUnique({
            where: { steamId },
            include: { team: true }
        });

        if (!user || !user.teamId) return { success: false, message: "No team to leave." };

        const teamId = user.teamId;
        const isOwner = user.team?.ownerId === steamId;

        if (isOwner) {
            // DISBAND TEAM Logic
            // 1. Remove all members
            // 2. Delete team
            await prisma.$transaction([
                prisma.user.updateMany({
                    where: { teamId: teamId },
                    data: { teamId: null }
                }),
                prisma.team.delete({
                    where: { id: teamId }
                })
            ]);
            return { success: true, message: "Team disbanded." };
        } else {
            // Just leave
            await prisma.user.update({
                where: { steamId },
                data: { teamId: null }
            });
            return { success: true, message: "Left team." };
        }

    } catch (error) {
        console.error("Leave Team Error:", error);
        return { success: false, message: "Error leaving team." };
    }
}

export async function getTeams() {
    try {
        const { prisma } = await import("@/lib/prisma");
        const teams = await prisma.team.findMany({
            include: {
                _count: {
                    select: { members: true }
                }
            },
            orderBy: { rating: 'desc' }
        });
        return teams;
    } catch (e) {
        return [];
    }
}

export async function kickMember(ownerSteamId: string, memberSteamId: string) {
    if (!ownerSteamId || !memberSteamId) return { success: false, message: "Invalid IDs" };

    try {
        const { prisma } = await import("@/lib/prisma");

        // 1. Verify Requesting User is Owner of the Team
        const owner = await prisma.user.findUnique({
            where: { steamId: ownerSteamId },
            include: { team: true }
        });

        if (!owner || !owner.team) return { success: false, message: "You don't own a team." };
        if (owner.team.ownerId !== ownerSteamId) return { success: false, message: "Only the captain can kick players." };

        // 2. Verify Target is in the same team
        const member = await prisma.user.findUnique({
            where: { steamId: memberSteamId }
        });

        if (!member || member.teamId !== owner.team.id) return { success: false, message: "Player is not in your team." };
        if (member.steamId === ownerSteamId) return { success: false, message: "You cannot kick yourself. Use 'Disband' instead." };

        // 3. Kick
        await prisma.user.update({
            where: { steamId: memberSteamId },
            data: { teamId: null }
        });

        revalidatePath(`/teams/${owner.team.tag}`);
        return { success: true, message: `Kicked ${member.name}.` };

    } catch (error) {
        console.error("Kick Error:", error);
        return { success: false, message: "Error kicking player." };
    }
}

export async function updateTeam(ownerSteamId: string, formData: FormData) {
    const logoUrl = formData.get("logoUrl") as string;
    const description = formData.get("description") as string;
    const countryCodes = formData.get("countryCodes") as string;

    try {
        const { prisma } = await import("@/lib/prisma");
        const owner = await prisma.user.findUnique({
            where: { steamId: ownerSteamId },
            include: { team: true }
        });

        if (!owner || !owner.team || owner.team.ownerId !== ownerSteamId) {
            return { success: false, message: "Unauthorized." };
        }

        await prisma.team.update({
            where: { id: owner.team.id },
            data: {
                logoUrl: logoUrl || undefined,
                description: description || undefined,
                countryCodes: countryCodes || undefined
            }
        });

        revalidatePath(`/teams/${owner.team.tag}`);
        return { success: true, message: "Team updated." };

    } catch (error) {
        return { success: false, message: "Update failed." };
    }
}
// ... existing code ...

export async function joinTeam(steamId: string, teamId: string) {
    if (!steamId || !teamId) return { success: false, message: "Invalid request." };

    try {
        const { prisma } = await import("@/lib/prisma");

        // 1. Verify User (must be authenticated and potentially check session in real app)
        // For MVP we trust the checking happens via UI state/session, but double check DB
        const user = await prisma.user.findUnique({
            where: { steamId },
            include: { team: true }
        });

        if (!user) return { success: false, message: "User not found." };
        if (user.teamId) return { success: false, message: "You are already in a team." };

        // 2. Verify Team (Slots available?)
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                members: true,
                _count: { select: { members: true } }
            }
        });

        if (!team) return { success: false, message: "Team not found." };
        if (team.members.length >= 5) return { success: false, message: "Team is full." };

        // 3. Join
        await prisma.user.update({
            where: { steamId },
            data: { teamId: teamId }
        });

        revalidatePath(`/teams/${team.tag}`);
        return { success: true, message: `Joined ${team.name}!` };

    } catch (error) {
        console.error("Join Error:", error);
        return { success: false, message: "Failed to join team." };
    }
}

export async function buySlot(ownerSteamId: string, teamId: string) {
    if (!ownerSteamId || !teamId) return { success: false, message: "Invalid request." };

    try {
        const { prisma } = await import("@/lib/prisma");
        const team = await prisma.team.findUnique({
            where: { id: teamId }
        });

        if (!team) return { success: false, message: "Team not found." };
        if (team.ownerId !== ownerSteamId) return { success: false, message: "Only the captain can buy slots." };
        if (team.maxMembers >= 10) return { success: false, message: "Max slots reached (10)." };

        // SIMULATE PAYMENT
        // In real app: await stripe.charges.create(...)
        await new Promise(r => setTimeout(r, 1000));

        await prisma.team.update({
            where: { id: teamId },
            data: { maxMembers: { increment: 1 } }
        });

        revalidatePath(`/teams/${team.tag}`);
        return { success: true, message: "Slot purchased! (+1 Total)" };

    } catch (error) {
        console.error("Buy Slot Error:", error);
        return { success: false, message: "Purchase failed." };
    }
}
