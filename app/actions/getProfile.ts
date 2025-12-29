'use server'



export async function getProfile(username: string) {
    try {
        // Decoding URI component to handle spaces/special chars
        const decodedName = decodeURIComponent(username);

        // Find user by name (Note: Names are not unique in Schema, so using findFirst)
        // Ideally we should use SteamID for routing
        const { prisma } = await import("@/lib/prisma");
        const user = await prisma.user.findFirst({
            where: {
                name: decodedName
            },
            include: {
                team: true,
                medals: {
                    include: {
                        medal: true
                    },
                    orderBy: {
                        awardedAt: 'desc'
                    }
                }
            }
        })

        if (!user) return null;

        return {
            userId: user.id,
            username: user.name || "Unknown",
            steamId: user.steamId || "",
            mainSide: user.mainSide,
            survivorWeapon: user.survivorWeapon,
            communication: user.communication,
            skillLevel: user.skillLevel,
            bio: user.bio,
            isPremium: user.isPremium,
            profileTheme: user.profileTheme,
            steamAvatarUrl: user.image || "/default_avatar.jpg",
            countryCode: user.countryCode || "MX", // Default to MX as requested by user if missing
            totalHours: user.totalHours,
            rank: (user.rank === "Unranked" || !user.rank) ? "Silver I" : user.rank,
            role: user.role,
            rating: user.rating,
            winRate: user.winRate,
            team: user.team ? {
                name: user.team.name,
                tag: user.team.tag,
                logoUrl: user.team.logoUrl || undefined
            } : undefined,
            medals: user.medals.map(m => ({
                id: m.medal.id,
                name: m.medal.name,
                description: m.medal.description,
                icon: m.medal.icon,
                color: m.medal.color,
                rarity: m.medal.rarity,
                awardedAt: m.awardedAt.toISOString(),
                note: m.note
            }))
        }


    } catch (error) {
        console.error("Error fetching profile:", error)
        return null
    }
}
