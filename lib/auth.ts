// @ts-nocheck
import SteamProvider from "next-auth-steam";
import type { NextRequest } from "next/server";
import type { NextAuthOptions } from "next-auth";

// Workaround for CJS/ESM mismatch
// @ts-expect-error - checking for default export property
const provider = SteamProvider.default || SteamProvider;

import CredentialsProvider from "next-auth/providers/credentials";

export function getAuthOptions(req?: NextRequest): NextAuthOptions {
    if (!process.env.STEAM_SECRET) {
        console.warn("Missing STEAM_SECRET, returning dummy credentials provider for build.");
        return {
            providers: [
                CredentialsProvider({
                    name: "BuildPlaceholder",
                    credentials: {},
                    authorize: async () => null
                })
            ]
        };
    }

    // Get the base URL from environment or request
    const getBaseUrl = () => {
        if (process.env.NEXTAUTH_URL) {
            return process.env.NEXTAUTH_URL;
        }
        if (req?.url) {
            const url = new URL(req.url);
            return `${url.protocol}//${url.host}`;
        }
        // Only use localhost as absolute last resort in development
        return process.env.NODE_ENV === 'production'
            ? 'https://www.l4d2ranked.online'
            : 'http://localhost:3000';
    };

    const baseUrl = getBaseUrl();

    // Create a valid request object for build time
    const buildTimeReq = {
        headers: new Headers(),
        url: `${baseUrl}/api/auth/callback/steam`
    } as any;

    return {
        providers: [
            provider(req || buildTimeReq, {
                clientSecret: process.env.STEAM_SECRET!,
                profile(profile: any) {
                    return {
                        id: profile.steamid,
                        name: profile.personaname,
                        image: profile.avatarfull,
                        email: null,
                        steamId: profile.steamid,
                    }
                },
            } as any),
        ],
        secret: process.env.NEXTAUTH_SECRET,
        session: {
            strategy: "jwt",
        },
        callbacks: {
            async jwt({ token, profile }) {
                if (profile) {
                    const p = profile as any;
                    token.steamId = p.steamid;
                    token.picture = p.avatarfull;

                    try {
                        // MANUAL SYNC: Save user to DB without relying on Adapter
                        const steamId = p.steamid;

                        const { prisma } = await import("@/lib/prisma");

                        // Fetch L4D2 Hours from Steam API
                        let hours = 0;
                        try {
                            const gamesRes = await fetch(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_SECRET}&steamid=${steamId}&format=json`);
                            const gamesData = await gamesRes.json();
                            const l4d2 = gamesData.response?.games?.find((g: any) => g.appid === 550);
                            if (l4d2) {
                                hours = Math.round(l4d2.playtime_forever / 60);
                            }
                        } catch (err) {
                            console.error("Failed to fetch Steam hours:", err);
                        }

                        await prisma.user.upsert({
                            where: { steamId: steamId },
                            update: {
                                name: p.personaname || "Unknown",
                                image: token.picture,
                                countryCode: p.loccountrycode,
                                totalHours: hours > 0 ? hours : undefined,
                            },
                            create: {
                                steamId: steamId,
                                name: p.personaname || "Unknown",
                                image: token.picture,
                                countryCode: p.loccountrycode,
                                totalHours: hours,
                                rating: 1000,
                            }
                        });

                        // Get user ID and store in token to avoid DB query on every session
                        const dbUser = await prisma.user.findUnique({
                            where: { steamId: steamId },
                            select: { id: true, rating: true, role: true }
                        });
                        if (dbUser) {
                            token.id = dbUser.id;
                            token.rating = dbUser.rating;
                            token.role = dbUser.role;
                        }

                        console.log("User synced to DB:", steamId);
                    } catch (e) {
                        console.error("Manual DB Sync Error", e);
                    }
                }
                return token;
            },
            async session({ session, token }) {
                if (session.user) {
                    // @ts-expect-error - Custom fields
                    session.user.steamId = token.steamId;
                    session.user.image = token.picture;

                    // Use token data if available (set during login)
                    if (token.id) {
                        // @ts-expect-error - Custom fields
                        session.user.id = token.id;
                        // @ts-expect-error - Custom fields
                        session.user.rating = token.rating;
                        // @ts-expect-error - Custom fields
                        session.user.role = token.role;
                    } else {
                        // Fallback: Get user ID from database (only if not in token)
                        try {
                            const { prisma } = await import("@/lib/prisma");
                            const user = await prisma.user.findUnique({
                                where: { steamId: token.steamId as string },
                                select: { id: true, rating: true, role: true }
                            });
                            if (user) {
                                // @ts-expect-error - Custom fields
                                session.user.id = user.id;
                                // @ts-expect-error - Custom fields
                                session.user.rating = user.rating;
                                // @ts-expect-error - Custom fields
                                session.user.role = user.role;
                            }
                        } catch (e) {
                            console.error("Failed to fetch user ID:", e);
                        }
                    }
                }
                return session;
            },
        },
    };
}

export const authOptions = getAuthOptions() as any;
