'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { revalidatePath } from "next/cache"

export async function updatePreferences(formData: FormData) {
    const session = await getServerSession(authOptions);

    // @ts-expect-error - steamId in session
    const steamId = session?.user?.steamId;

    if (!steamId) {
        return { success: false, message: "Unauthorized" };
    }

    const mainSide = formData.get("mainSide") as string;
    const survivorWeapon = formData.get("survivorWeapon") as string;
    const communication = formData.get("communication") as string;
    const skillLevel = formData.get("skillLevel") as string;
    const bio = formData.get("bio") as string;

    if (!mainSide) {
        return { success: false, message: "Please select a Main Side." };
    }

    // Validation
    const validSides = ["SURVIVOR", "INFECTED", "BOTH"];
    const validWeapons = ["SMG", "SHOTGUN", "BOTH"];
    const validComm = ["MIC_ACTIVE", "ONLY_INFO", "LISTEN", "NO_MIC"];
    const validSkill = ["CASUAL", "SEMI_COMP", "COMPETITIVE", "TOURNAMENT"];

    if (!validSides.includes(mainSide)) return { success: false, message: "Invalid Side" };
    if (mainSide !== "INFECTED" && survivorWeapon && !validWeapons.includes(survivorWeapon)) {
        return { success: false, message: "Invalid Weapon" };
    }
    if (communication && !validComm.includes(communication)) return { success: false, message: "Invalid Comm Style" };
    if (skillLevel && !validSkill.includes(skillLevel)) return { success: false, message: "Invalid Skill Level" };
    if (bio && bio.length > 140) return { success: false, message: "Bio too long (max 140)" };

    try {
        await prisma.user.update({
            where: { steamId },
            data: {
                mainSide,
                survivorWeapon: (mainSide === "INFECTED") ? null : survivorWeapon,
                communication,
                skillLevel,
                bio
            }
        });

        revalidatePath(`/profile/${steamId}`);
        return { success: true, message: "Profile updated successfully!" };

    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to update profile" };
    }
}

export async function buyPremium() {
    const session = await getServerSession(authOptions);
    // @ts-expect-error
    if (!session?.user?.steamId) return { success: false, message: "Not authenticated" };
    // @ts-expect-error
    const steamId = session.user.steamId;

    try {
        await prisma.user.update({
            where: { steamId },
            data: { isPremium: true }
        });
        revalidatePath(`/profile/${steamId}`);
        return { success: true, message: "Premium Activated!" };
    } catch (e) {
        return { success: false, message: "Transaction failed" };
    }
}

export async function updateTheme(theme: string) {
    const session = await getServerSession(authOptions);
    // @ts-expect-error
    if (!session?.user?.steamId) return { success: false, message: "Not authenticated" };
    // @ts-expect-error
    const steamId = session.user.steamId;

    // Validate Theme
    const validThemes = ["DEFAULT", "GOLD", "DIAMOND", "RUBY", "EMERALD", "VOID"];
    if (!validThemes.includes(theme)) return { success: false, message: "Invalid Theme" };

    try {
        // Verify Premium Status
        const user = await prisma.user.findUnique({ where: { steamId } });
        if (!user?.isPremium && theme !== "DEFAULT") {
            return { success: false, message: "Premium required for themes" };
        }

        await prisma.user.update({
            where: { steamId },
            data: { profileTheme: theme }
        });
        revalidatePath(`/profile/${steamId}`);
        return { success: true, message: "Theme updated!" };
    } catch (e) {
        return { success: false, message: "Update failed" };
    }
}
