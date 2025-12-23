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
    return {
        providers: [
            provider(req || {
                headers: new Headers(),
                url: process.env.NEXTAUTH_URL || 'http://localhost:3000/api/auth/callback'
            } as any, {
                clientSecret: process.env.STEAM_SECRET,
                callbackUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback`,
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
                        console.log("User synced to DB manualy:", steamId);
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
                }
                return session;
            },
        },
    };
}

export const authOptions = getAuthOptions() as any;
