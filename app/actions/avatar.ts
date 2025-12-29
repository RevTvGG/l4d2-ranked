'use server'

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function refreshAvatar() {
    const session = await getServerSession(authOptions);

    // @ts-expect-error - steamId in session
    const steamId = session?.user?.steamId;

    if (!steamId) {
        return { success: false, message: "Not authenticated" };
    }

    try {
        // Fetch fresh profile from Steam API
        const steamApiKey = process.env.STEAM_SECRET;
        if (!steamApiKey) {
            return { success: false, message: "Steam API not configured" };
        }

        const response = await fetch(
            `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${steamId}`
        );

        if (!response.ok) {
            return { success: false, message: "Failed to fetch from Steam" };
        }

        const data = await response.json();
        const player = data.response?.players?.[0];

        if (!player) {
            return { success: false, message: "Player not found on Steam" };
        }

        const newAvatar = player.avatarfull;
        const newName = player.personaname;

        // Update database
        const { prisma } = await import("@/lib/prisma");
        await prisma.user.update({
            where: { steamId },
            data: {
                image: newAvatar,
                name: newName,
            }
        });

        // Revalidate pages
        revalidatePath(`/profile/${newName}`);
        revalidatePath('/faq');
        revalidatePath('/leaderboard');

        return { success: true, message: "Avatar updated!", newAvatar };

    } catch (e) {
        console.error("Avatar refresh error:", e);
        return { success: false, message: "Failed to refresh avatar" };
    }
}
