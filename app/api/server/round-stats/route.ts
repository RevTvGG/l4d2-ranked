import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { server_key, match_id, map_name, players } = body;

        // 1. Validate Server Key
        if (server_key !== process.env.l4d2_ranked_server_key) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!match_id) {
            return NextResponse.json({ error: "Missing match_id" }, { status: 400 });
        }

        // 2. Verify Match Exists
        const match = await prisma.match.findUnique({
            where: { id: match_id },
            include: {
                players: {
                    include: {
                        user: true
                    }
                }
            }
        });

        if (!match) {
            console.error(`[RoundStats] Match not found: ${match_id}`);
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        // 3. Create Round Record
        // We don't have a reliable round number from the plugin yet, so we'll auto-increment based on existing rounds or just use a timestamp-based approach.
        // For now, let's just count existing rounds for this match.
        const roundCount = await prisma.round.count({
            where: { matchId: match_id }
        });

        const roundNumber = roundCount + 1;

        const round = await prisma.round.create({
            data: {
                matchId: match_id,
                map: map_name || "unknown",
                roundNumber: roundNumber,
                endedAt: new Date(), // We assume this is received at round end
            }
        });

        console.log(`[RoundStats] Processing Round ${roundNumber} for Match ${match_id} (Map: ${map_name})`);

        // 4. Process Player Stats
        for (const playerStats of players) {
            const { steam_id, kills, deaths, headshots, damage } = playerStats;

            // Find the MatchPlayer entry
            // We need to resolve SteamID. The plugin sends STEAM_X:Y:Z.
            // We'll search for the User with this steamId.

            // Attempt to find user by SteamID directly (assuming exact match in DB)
            // Note: SteamID format differences (STEAM_0 vs STEAM_1) might be an issue. 
            // Ideally we'd have a helper, but for now we try to match what we have.

            // Find match participant with this SteamID
            const matchPlayer = match.players.find(p => p.user.steamId === steam_id || p.user.steamId === steam_id.replace("STEAM_1:", "STEAM_0:"));

            if (!matchPlayer) {
                console.warn(`[RoundStats] Player not found in match: ${steam_id}`);
                continue;
            }

            // Create PlayerRoundStats
            await prisma.playerRoundStats.create({
                data: {
                    roundId: round.id,
                    matchPlayerId: matchPlayer.id,
                    steamId: steam_id,
                    kills: kills,
                    deaths: deaths,
                    headshots: headshots,
                    damage: damage,
                    common: 0 // Plugin doesn't send common kills yet
                }
            });

            // Update MatchPlayer Aggregates (Increment)
            await prisma.matchPlayer.update({
                where: { id: matchPlayer.id },
                data: {
                    kills: { increment: kills },
                    deaths: { increment: deaths },
                    headshots: { increment: headshots },
                    damage: { increment: damage }
                }
            });
        }

        return NextResponse.json({ success: true, round: round.id });
    } catch (error) {
        console.error("[RoundStats] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
