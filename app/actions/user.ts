'use server'


import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
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
    const staffBio = formData.get("staffBio") as string;

    // Premium Fields
    const customTitle = formData.get("customTitle") as string;
    const profileColor = formData.get("profileColor") as string;
    const nameGradient = formData.get("nameGradient") as string;
    const profileBanner = formData.get("profileBanner") as string;
    const profileFrame = formData.get("profileFrame") as string;
    const profileTheme = formData.get("profileTheme") as string;
    const profileGlow = formData.get("profileGlow") === "on";

    if (!mainSide) {
        return { success: false, message: "Please select a Main Side." };
    }

    // Validation
    const validSides = ["SURVIVOR", "INFECTED", "BOTH"];
    const validWeapons = ["SMG", "SHOTGUN", "BOTH"];
    const validComm = ["MIC_ACTIVE", "ONLY_INFO", "LISTEN", "NO_MIC"];
    const validSkill = ["CASUAL", "SEMI_COMP", "COMPETITIVE", "TOURNAMENT"];

    // Validate Theme if present
    const validThemes = ["DEFAULT", "GOLD", "DIAMOND", "RUBY", "EMERALD", "VOID"];

    if (!validSides.includes(mainSide)) return { success: false, message: "Invalid Side" };
    if (mainSide !== "INFECTED" && survivorWeapon && !validWeapons.includes(survivorWeapon)) {
        return { success: false, message: "Invalid Weapon" };
    }
    if (communication && !validComm.includes(communication)) return { success: false, message: "Invalid Comm Style" };
    if (skillLevel && !validSkill.includes(skillLevel)) return { success: false, message: "Invalid Skill Level" };
    if (bio && bio.length > 140) return { success: false, message: "Bio too long (max 140)" };
    if (staffBio && staffBio.length > 300) return { success: false, message: "Staff Bio too long (max 300)" };
    if (profileTheme && !validThemes.includes(profileTheme)) return { success: false, message: "Invalid Theme" };

    try {
        const { prisma } = await import("@/lib/prisma");

        // Fetch current user to check role for Staff Bio permission
        const currentUser = await prisma.user.findUnique({
            where: { steamId },
            select: { role: true, isPremium: true }
        });

        const isStaff = currentUser?.role && ['OWNER', 'ADMIN', 'MODERATOR'].includes(currentUser.role);

        // Prepare update data
        const updateData: any = {
            mainSide,
            survivorWeapon: (mainSide === "INFECTED") ? null : survivorWeapon,
            communication,
            skillLevel,
            bio
        };

        // Update Premium Fields if user is Premium
        if (currentUser?.isPremium) {
            updateData.customTitle = customTitle && customTitle.length <= 30 ? customTitle : undefined;
            updateData.profileColor = profileColor;
            updateData.nameGradient = nameGradient;
            updateData.profileBanner = profileBanner;
            updateData.profileFrame = profileFrame;
            updateData.profileGlow = profileGlow;
            if (profileTheme) updateData.profileTheme = profileTheme;
        }

        // Only update staffBio if user is staff
        if (isStaff && staffBio !== null) {
            updateData.staffBio = staffBio;
        }

        await prisma.user.update({
            where: { steamId },
            data: updateData
        });

        revalidatePath(`/profile/${steamId}`);
        revalidatePath('/faq'); // Update Meet the Team section
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
        const { prisma } = await import("@/lib/prisma");
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
        const { prisma } = await import("@/lib/prisma");
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
