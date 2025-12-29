"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Generate a readable invite code like "BETA-XXXX-XXXX"
function generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I, O, 1, 0 to avoid confusion
    const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `BETA-${segment()}-${segment()}`;
}

// =========== ADMIN ACTIONS ===========

export async function createInviteCodes(count: number = 1) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    // Get user role
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
        return { error: "Unauthorized: Admin only" };
    }

    const codes: string[] = [];
    for (let i = 0; i < Math.min(count, 50); i++) { // Max 50 at a time
        let code = generateCode();
        // Ensure uniqueness
        let exists = await prisma.inviteCode.findUnique({ where: { code } });
        while (exists) {
            code = generateCode();
            exists = await prisma.inviteCode.findUnique({ where: { code } });
        }

        await prisma.inviteCode.create({
            data: {
                code,
                createdBy: session.user.id
            }
        });
        codes.push(code);
    }

    revalidatePath("/admin/invites");
    return { success: true, codes };
}

export async function getInviteCodes() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { error: "Not authenticated", invites: [] };
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
        return { error: "Unauthorized", invites: [] };
    }

    const invites = await prisma.inviteCode.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            user: { select: { id: true, name: true, image: true, steamId: true } },
            creator: { select: { name: true } }
        }
    });

    return { invites };
}

export async function deleteInviteCode(codeId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
        return { error: "Unauthorized" };
    }

    const invite = await prisma.inviteCode.findUnique({ where: { id: codeId } });
    if (!invite) {
        return { error: "Invite not found" };
    }
    if (invite.isUsed) {
        return { error: "Cannot delete a used invite code" };
    }

    await prisma.inviteCode.delete({ where: { id: codeId } });
    revalidatePath("/admin/invites");
    return { success: true };
}

// =========== PUBLIC ACTION (Redeem Code) ===========

export async function redeemInviteCode(code: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { error: "You must be logged in" };
    }

    // Check if user already has access
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { betaAccess: true }
    });

    if (user?.betaAccess) {
        return { error: "You already have beta access!" };
    }

    // Find the invite code
    const invite = await prisma.inviteCode.findUnique({
        where: { code: code.toUpperCase().trim() }
    });

    if (!invite) {
        return { error: "Invalid invite code" };
    }

    if (invite.isUsed) {
        return { error: "This code has already been used" };
    }

    // Redeem the code
    await prisma.$transaction([
        prisma.inviteCode.update({
            where: { id: invite.id },
            data: {
                isUsed: true,
                usedBy: session.user.id,
                usedAt: new Date()
            }
        }),
        prisma.user.update({
            where: { id: session.user.id },
            data: { betaAccess: true }
        })
    ]);

    revalidatePath("/");
    return { success: true };
}

// =========== Check Beta Access ===========
export async function checkBetaAccess(): Promise<boolean> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return true; // Not logged in = no gate needed (they see public pages)
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { betaAccess: true }
    });

    return user?.betaAccess ?? false;
}
