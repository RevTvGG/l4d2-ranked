import NextAuth from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id: string
            name?: string | null
            email?: string | null
            image?: string | null
            steamId?: string
            role?: string
            rating?: number
        }
    }

    interface User {
        id: string
        steamId: string
        rating: number
        role: string
    }
}
