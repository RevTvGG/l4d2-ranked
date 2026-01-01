
import Link from "next/link";
import Image from "next/image";

import { PremiumBadge } from "./PremiumBadge";
import { ShinyText } from "./ShinyText";

import { getLeaderboard } from "@/app/actions/getLeaderboard";
import { getRankForElo } from "@/lib/ranks";

export async function LeaderboardTable() {
    const players = await getLeaderboard();

    if (players.length === 0) {
        return (
            <div className="text-center py-20 text-zinc-500 border border-white/5 rounded-xl bg-zinc-900/20">
                <p className="text-xl font-bold mb-2">No Players Ranked Yet</p>
                <p className="text-sm">Be the first to calibrate by playing a match.</p>
            </div>
        )
    }

    return (
        <div className="w-full max-w-6xl mx-auto">

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5 md:col-span-4">Player</div>
                <div className="col-span-2 text-center hidden md:block">Tier</div>
                <div className="col-span-2 text-center">Rating</div>
                <div className="col-span-2 text-center hidden md:block">Win Rate</div>
                <div className="col-span-2 md:col-span-1 text-right">Matches</div>
            </div>

            {/* Rows */}
            <div className="space-y-2 mt-4">
                {players.map((player) => (
                    <LeaderboardRow key={player.rank} player={player} />
                ))}
            </div>
        </div>
    );
}

function LeaderboardRow({ player }: { player: any }) {
    const isTop1 = player.rank === 1;
    const isTop2 = player.rank === 2;
    const isTop3 = player.rank === 3;

    // Use shared rank logic
    const rankInfo = getRankForElo(player.rating);

    let rowStyle = "bg-zinc-900/40 border-white/5 hover:border-white/10";
    let rankColor = "text-zinc-500";
    let glow = "";

    if (isTop1) {
        rowStyle = "bg-yellow-900/10 border-yellow-500/50 hover:border-yellow-400";
        rankColor = "text-yellow-400";
        glow = "shadow-[0_0_20px_rgba(234,179,8,0.1)]";
    } else if (isTop2) {
        rowStyle = "bg-zinc-800/40 border-slate-400/50 hover:border-slate-300";
        rankColor = "text-slate-300";
    } else if (isTop3) {
        rowStyle = "bg-orange-900/10 border-orange-700/50 hover:border-orange-600";
        rankColor = "text-orange-400";
    }

    // Premium Styles for Row
    if (player.isPremium && !isTop1 && !isTop2 && !isTop3) {
        rowStyle = "bg-zinc-900/60 border-indigo-500/20 hover:border-indigo-500/40";
    }

    return (
        <Link
            href={`/profile/${player.username}`}
            className={`grid grid-cols-12 gap-4 px-6 py-4 rounded-xl border items-center transition-all hover:scale-[1.01] hover:bg-zinc-800/60 group ${rowStyle} ${glow}`}
        >
            {/* 1. Rank */}
            <div className={`col-span-1 text-center font-black text-xl ${rankColor}`}>
                {player.rank}
            </div>

            {/* 2. Player Info */}
            <div className="col-span-5 md:col-span-4 flex items-center gap-4">
                <div className="relative h-10 w-10">
                    <Image
                        src={player.steamAvatarUrl.startsWith("http") ? player.steamAvatarUrl : "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg"}
                        alt={player.username}
                        fill
                        className={`rounded-full object-cover border-2 ${player.isPremium ? 'border-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]' : isTop1 ? 'border-yellow-500' : 'border-zinc-800'}`}
                    />
                    <div className="absolute -bottom-1 -right-1 text-[10px] bg-zinc-900 px-1 rounded border border-white/10 text-white">
                        {player.region}
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className={`font-bold text-sm ${isTop1 ? 'text-yellow-100' : 'text-zinc-200'} group-hover:text-white flex items-center gap-1.5`}>
                        {player.isPremium ? (
                            <ShinyText text={player.username} theme={player.profileTheme} />
                        ) : (
                            player.username
                        )}
                        {player.isPremium && <PremiumBadge theme={player.profileTheme} />}
                    </span>
                    {player.team && (
                        <span className="text-xs text-zinc-500 group-hover:text-brand-green transition-colors">
                            [{player.team.tag}] {player.team.name}
                        </span>
                    )}
                </div>
            </div>

            {/* 3. Tier (Calculated from ELO) */}
            <div className="col-span-2 text-center hidden md:flex items-center justify-center gap-2">
                <div className="relative w-8 h-8 drop-shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Image
                        src={rankInfo.imagePath}
                        alt={rankInfo.name}
                        fill
                        className="object-contain"
                    />
                </div>
                <span className="text-xs font-black tracking-wider uppercase" style={{ color: rankInfo.color }}>
                    {rankInfo.name}
                </span>
            </div>

            {/* 4. Rating */}
            <div className="col-span-2 text-center font-mono font-bold text-brand-green">
                {player.rating}
            </div>

            {/* 5. Win Rate (Hidden on mobile) */}
            <div className="col-span-2 text-center hidden md:block text-zinc-400 font-medium">
                {player.winRate}%
            </div>

            {/* 6. Matches */}
            <div className="col-span-2 md:col-span-1 text-right text-zinc-600 text-sm">
                {player.matches}
            </div>

        </Link>
    );
}
