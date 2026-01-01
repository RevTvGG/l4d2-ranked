'use server'

export async function getLeaderboard() {
    try {
        const { prisma } = await import("@/lib/prisma");
        const players = await prisma.user.findMany({
            orderBy: {
                rating: 'desc'
            },
            take: 50,
            select: {
                id: true,
                name: true,
                image: true,
                rating: true,
                wins: true,
                losses: true,
                winRate: true,
                countryCode: true,
                isPremium: true,
                profileTheme: true,
                customFont: true,
                profileFrame: true,
                customTitle: true,
                nameGradient: true,
                profileGlow: true,
                team: {
                    select: {
                        name: true,
                        tag: true
                    }
                }
            } as any
        })

        return players.map((player: any, index: number) => ({
            rank: index + 1,
            username: player.name || "Unknown Survivor",
            steamAvatarUrl: player.image || "/default_avatar.jpg",
            team: player.team,
            rating: player.rating,
            winRate: ((player.wins + player.losses) > 0 ? (player.wins / (player.wins + player.losses) * 100) : 0).toFixed(1),
            matches: player.wins + player.losses,
            region: player.countryCode || "VN",
            isPremium: player.isPremium,
            profileTheme: player.profileTheme,
            customFont: player.customFont,
            profileFrame: player.profileFrame,
            customTitle: player.customTitle,
            nameGradient: player.nameGradient,
            profileGlow: player.profileGlow,
        }))
    } catch (error) {
        console.error("Error fetching leaderboard:", error)
        return []
    }
}
