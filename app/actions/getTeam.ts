'use server'

import { prisma } from "@/lib/prisma"

export async function getTeamByTag(tag: string) {
    try {
        const team = await prisma.team.findUnique({
            where: {
                tag: tag
            },
            include: {
                members: {
                    select: {
                        name: true,
                        image: true,
                        rating: true,
                        role: true,
                        countryCode: true,
                        steamId: true
                    }
                }
            }
        })

        return team;
    } catch (error) {
        console.error("Error fetching team:", error)
        return null
    }
}
