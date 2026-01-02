"use client";

import Image from "next/image";
import { getRankForElo } from "@/lib/ranks";
import Link from "next/link";
import { MedalList } from "./MedalList";
import { getThemeColors } from "@/lib/themes";

import { PremiumBadge } from "./PremiumBadge";
import { ShinyText } from "./ShinyText";
import { RefreshAvatarButton } from "./RefreshAvatarButton";
import { PremiumUsername } from "./PremiumUsername";
import { MatchHistory } from "./MatchHistory";

interface Team {
    name: string;
    tag: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    members?: {
        id: string;
        name: string;
        image: string | null;
    }[];
}

interface Medal {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    awardedAt: string;
    note?: string | null;
}

interface PlayerProfileProps {
    userId: string;
    username: string;
    steamId: string;
    steamAvatarUrl: string;
    countryCode: string;
    totalHours: number;
    rank: string;
    role: string;
    rating: number;
    winRate: number;
    mainSide?: string | null;
    survivorWeapon?: string | null;
    communication?: string | null;
    skillLevel?: string | null;
    bio?: string | null;
    isPremium?: boolean;
    profileTheme?: string;
    profileColor?: string | null;
    profileGlow?: boolean;
    profileBanner?: string | null;
    nameGradient?: string | null;
    profileFrame?: string | null;
    customTitle?: string | null;
    customFont?: string | null;
    premiumIcon?: string | null;
    playstylePublic?: boolean;
    team?: Team; // Optional: Player might not have a team
    isOwner?: boolean; // True if viewing own profile
    medals?: {
        id: string;
        name: string;
        description: string;
        icon: string;
        color: string;
        rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
        awardedAt: string;
        note?: string | null;
    }[];
    // New stats
    totalKills?: number;
    totalDeaths?: number;
    totalDamage?: number;
    totalHeadshots?: number;
    totalMvps?: number;
    weaponStats?: Record<string, any>;
    ratingHistory?: number[]; // Added ratingHistory back
    totalWins?: number;
    totalLosses?: number;
    rankingPosition?: number;
    // Match History (Premium Feature)
    matchHistory?: {
        matchId: string;
        mapName: string;
        date: string;
        result: 'WIN' | 'LOSS' | 'DRAW';
        eloChange: number;
        team: 'A' | 'B';
        teammates: { id: string; name: string; image: string | null; steamId: string | null }[];
        opponents: { id: string; name: string; image: string | null; steamId: string | null }[];
    }[];
}

export function PlayerProfile({
    userId,
    username,
    steamId,
    steamAvatarUrl,
    totalHours,
    rank,
    role,
    rating,
    winRate,
    mainSide,
    survivorWeapon,
    communication,
    skillLevel,
    bio,
    isPremium,
    profileTheme = "DEFAULT",
    profileColor,
    profileGlow,
    profileBanner,
    nameGradient,
    profileFrame,
    customTitle,
    customFont,
    premiumIcon,
    playstylePublic = true,
    team,
    countryCode,
    isOwner = false,
    medals = [],
    // Defaults
    totalKills = 0,
    totalDeaths = 0,
    totalDamage = 0,
    totalHeadshots = 0,
    totalMvps = 0,
    weaponStats = {},
    ratingHistory = [],
    totalWins = 0,
    totalLosses = 0,
    rankingPosition,
    matchHistory = [],
}: PlayerProfileProps) {
    // Get theme colors based on user's selected theme
    // Handle legacy "DEFAULT" theme by converting to "emerald"
    const themeColors = getThemeColors(profileTheme === "DEFAULT" ? "emerald" : profileTheme);

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">

            {/* 1. HERO SECTION - PREMIUM DESIGN */}
            <div
                className="relative rounded-3xl overflow-hidden border-2 shadow-2xl transition-all duration-700 group bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-black/95 backdrop-blur-xl hover:shadow-[0_30px_100px_-20px_var(--theme-glow)]"
                style={{
                    borderColor: `${themeColors.primary}40`,
                    boxShadow: `0 20px 80px -20px ${themeColors.glow}, 0 0 40px -10px ${themeColors.glow}`,
                    '--theme-glow': themeColors.glow,
                } as React.CSSProperties}
            >
                {/* Animated gradient background */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{ background: `linear-gradient(to bottom right, ${themeColors.primary}10, transparent, ${themeColors.accent}10)` }}
                />

                {/* Multiple animated scan lines */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                        className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent to-transparent animate-scan-line"
                        style={{
                            backgroundImage: `linear-gradient(to right, transparent, ${themeColors.primary}60, transparent)`,
                            filter: `drop-shadow(0 0 10px ${themeColors.glow})`
                        }}
                    />
                    <div
                        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent to-transparent animate-scan-line"
                        style={{
                            backgroundImage: `linear-gradient(to right, transparent, ${themeColors.accent}40, transparent)`,
                            animationDelay: '2s'
                        }}
                    />
                </div>

                {/* Premium corner frame */}
                <div
                    className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-2xl"
                    style={{ borderColor: `${themeColors.primary}60` }}
                />
                <div
                    className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-2xl"
                    style={{ borderColor: `${themeColors.primary}60` }}
                />
                <div
                    className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-2xl"
                    style={{ borderColor: `${themeColors.primary}60` }}
                />
                <div
                    className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-2xl"
                    style={{ borderColor: `${themeColors.primary}60` }}
                />

                {/* Inner glow effect */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 blur-3xl"
                    style={{ background: `linear-gradient(to bottom, ${themeColors.primary}20, transparent)` }}
                />

                {/* ACTION BUTTONS (Visible to owner) */}
                {isOwner && (
                    <div className="absolute top-6 right-6 z-30 flex items-center gap-2">
                        <RefreshAvatarButton />
                        <a
                            href="/profile/edit"
                            className="h-10 w-10 flex items-center justify-center rounded-full bg-black/50 border border-white/10 text-zinc-400 hover:text-white hover:bg-black/80 hover:rotate-90 transition-all backdrop-blur-md"
                            title="Edit Profile"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.86z" />
                            </svg>
                        </a>
                    </div>
                )}

                {/* Background Image/Gradient */}
                <div className="absolute inset-0 z-0">
                    {profileBanner ? (
                        <Image
                            src={profileBanner}
                            alt="Profile Banner"
                            fill
                            className="object-cover opacity-50 blur-[2px] transition-all duration-700 hover:blur-0 hover:scale-105"
                        />
                    ) : (
                        <div
                            className="w-full h-full bg-[url('/l4d2_bg.jpg')] bg-cover bg-center opacity-40 mix-blend-luminosity"
                        ></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent"></div>
                </div>

                <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-end gap-8 z-10">
                    {/* Avatar Hexagon Wrapper */}
                    <div className="relative shrink-0 group/avatar">
                        <a
                            href={`https://steamcommunity.com/profiles/${steamId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block h-32 w-32 md:h-40 md:w-40 rounded-2xl rotate-3 border-4 overflow-hidden shadow-2xl relative z-20 transition-all hover:rotate-0 hover:scale-105 duration-300
                                ${profileFrame === 'GOLD' ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]' :
                                    profileFrame === 'DIAMOND' ? 'border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.5)]' :
                                        profileFrame === 'FIRE' ? 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)] animate-pulse-slow' :
                                            profileFrame === 'ICE' ? 'border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.6)]' :
                                                profileFrame === 'ELECTRIC' ? 'border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.6)]' :
                                                    profileFrame === 'RAINBOW' ? 'border-transparent bg-gradient-to-r from-red-500 via-green-500 to-blue-500 p-[3px]' :
                                                        profileFrame === 'EMERALD' ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]' :
                                                            profileFrame === 'RUBY' ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]' :
                                                                profileFrame === 'PLASMA' ? 'border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.6)] animate-pulse' :
                                                                    profileFrame === 'VOID' ? 'border-purple-900 shadow-[0_0_25px_rgba(88,28,135,0.8)]' :
                                                                        profileFrame === 'LEGENDARY' ? 'border-yellow-300 animate-pulse shadow-[0_0_25px_rgba(253,224,71,0.7)]' :
                                                                            profileFrame === 'LEGENDARY' ? 'border-yellow-300 animate-pulse shadow-[0_0_25px_rgba(253,224,71,0.7)]' :
                                                                                isPremium ? 'shadow-lg border-opacity-80' : 'border-white/10 bg-zinc-800'
                                }
                            `}
                            style={isPremium && !['GOLD', 'DIAMOND', 'FIRE', 'ICE', 'ELECTRIC', 'RAINBOW', 'EMERALD', 'RUBY', 'PLASMA', 'VOID', 'LEGENDARY'].includes(profileFrame || '') ? {
                                borderColor: themeColors.primary,
                                boxShadow: `0 0 20px ${themeColors.glow}`
                            } : undefined}
                        >
                            {/* Wrapper for rainbow frame needing internal consistency */}
                            <div className={`w-full h-full rounded-xl overflow-hidden ${profileFrame === 'RAINBOW' ? 'bg-zinc-900 border-2 border-zinc-900' : ''}`}>
                                {steamAvatarUrl ? (
                                    <Image
                                        src={steamAvatarUrl}
                                        alt={`${username}'s avatar`}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500 text-4xl font-bold">
                                        {username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}
                            </div>
                        </a>
                        {/* Glow Effect */}
                        {(isPremium || profileGlow) && <div className={`absolute inset-0 -rotate-3 rounded-2xl blur-xl z-0 ${profileGlow ? 'bg-brand-green/40 animate-pulse' : 'bg-brand-green/20'}`}></div>}
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 space-y-4 mb-2 min-w-0"> {/* min-w-0 ensures flex child shrinks text */}
                        <div className="flex flex-wrap items-center justify-between gap-4"> {/* Increased Gap */}
                            <div className="flex flex-wrap items-center gap-2">

                                {/* 1. STAFF BADGE (Top Priority) */}
                                {(role === 'OWNER' || role === 'ADMIN' || role === 'MODERATOR') && (
                                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-black/50 ${role === 'OWNER' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]' :
                                        role === 'ADMIN' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                            'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                        }`}>
                                        {role === 'OWNER' && '👑 OWNER'}
                                        {role === 'ADMIN' && '🛡️ ADMIN'}
                                        {role === 'MODERATOR' && '🔨 MODERATOR'}
                                    </span>
                                )}


                                {/* 2. SKILL LEVEL - Respects playstylePublic */}
                                {(playstylePublic || isOwner) && skillLevel && (
                                    <span className="px-2.5 py-1 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                        <span className="opacity-70">
                                            {skillLevel === 'CASUAL' ? '☕' :
                                                skillLevel === 'SEMI_COMP' ? '⚔️' :
                                                    skillLevel === 'COMPETITIVE' ? '🏆' : '👽'}
                                        </span>
                                        {skillLevel.replace('_', ' ')}
                                    </span>
                                )}

                                {/* 4. MAIN SIDE - Respects playstylePublic */}
                                {(playstylePublic || isOwner) && mainSide && (
                                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${mainSide === 'INFECTED' ? 'bg-red-900/10 text-red-500 border-red-900/40' : 'bg-cyan-900/10 text-cyan-400 border-cyan-900/40'
                                        }`}>
                                        <span className="opacity-70">
                                            {mainSide === 'INFECTED' ? '🦠' : mainSide === 'SURVIVOR' ? '🧍' : '☯️'}
                                        </span>
                                        {mainSide === 'BOTH_SIDES' ? 'HYBRID' : mainSide}
                                    </span>
                                )}

                                {/* 5. WEAPON - Respects playstylePublic */}
                                {(playstylePublic || isOwner) && survivorWeapon && (
                                    <span className="px-2.5 py-1 rounded-full border border-zinc-700/50 bg-zinc-800/50 text-zinc-300 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                        <span className="opacity-70">
                                            {survivorWeapon === 'SMG' ? '🔫' : survivorWeapon === 'SHOTGUN' ? '💥' : '🔁'}
                                        </span>
                                        {survivorWeapon}
                                    </span>
                                )}

                                {/* 6. COMM - Respects playstylePublic */}
                                {(playstylePublic || isOwner) && communication && (
                                    <span className="px-2.5 py-1 rounded-full border border-yellow-500/20 bg-yellow-500/5 text-yellow-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                        <span className="opacity-70">
                                            {communication === 'MIC_ACTIVE' ? '🎙️' :
                                                communication === 'ONLY_INFO' ? '🎧' :
                                                    communication === 'LISTEN' ? '👂' : '❌'}
                                        </span>
                                        {communication === 'MIC_ACTIVE' ? 'VOICE' : communication === 'ONLY_INFO' ? 'INFO' : communication}
                                    </span>
                                )}

                                {/* 7. COUNTRY */}
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 text-zinc-400 text-[10px] font-bold border border-white/5" title={countryCode}>
                                    <span className="text-sm leading-none">{getFlagEmoji(countryCode)}</span>
                                    <span>{countryCode || "UNK"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            {/* TOP 3 RANK BADGE */}
                            {rankingPosition && rankingPosition <= 3 && (
                                <div className="mb-2 self-start animate-fade-in-up">
                                    <span className={`px-3 py-1 rounded-lg border-2 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl backdrop-blur-md
                                        ${rankingPosition === 1 ? 'bg-gradient-to-r from-yellow-600/20 to-amber-500/20 text-yellow-300 border-yellow-500 shadow-yellow-500/20' :
                                            rankingPosition === 2 ? 'bg-gradient-to-r from-slate-500/20 to-zinc-400/20 text-zinc-300 border-slate-400 shadow-slate-400/20' :
                                                'bg-gradient-to-r from-orange-700/20 to-orange-600/20 text-orange-400 border-orange-600 shadow-orange-600/20'}
                                    `}>
                                        <span className="text-base leading-none filter drop-shadow-md">
                                            {rankingPosition === 1 ? '👑' : rankingPosition === 2 ? '🥈' : '🥉'}
                                        </span>
                                        {rankingPosition === 1 ? 'TOP #1 RANKING' : rankingPosition === 2 ? 'TOP #2 RANKING' : 'TOP #3 RANKING'}
                                    </span>
                                </div>
                            )}

                            {customTitle && (
                                <span className={`text-sm font-bold uppercase tracking-widest mb-1 ${profileTheme === 'FIRE' ? 'text-orange-500' :
                                    profileTheme === 'ICE' ? 'text-cyan-400' :
                                        profileTheme === 'GOLD' ? 'text-yellow-400' :
                                            'text-brand-green'
                                    }`}>
                                    {customTitle}
                                </span>
                            )}
                            <h1 className="leading-none break-all max-w-full">
                                <PremiumUsername
                                    username={username}
                                    isPremium={isPremium}
                                    profileTheme={profileTheme}
                                    nameGradient={nameGradient}
                                    customFont={customFont}
                                    premiumIcon={premiumIcon}
                                    size="4xl"
                                    showBadge={isPremium}
                                    showGlow={profileGlow}
                                    className="uppercase italic"
                                />
                            </h1>
                        </div>

                        {/* BIO SECTION */}
                        {bio && (
                            <p className="text-zinc-400 text-sm md:text-base max-w-2xl font-medium leading-relaxed border-l-2 border-brand-green pl-4 my-2 italic">
                                &quot;{bio}&quot;
                            </p>
                        )}
                        {!bio && <div className="h-2"></div>}

                        <div className="flex items-center gap-6 text-zinc-400 font-medium">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded bg-zinc-800 text-brand-green">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm.293-5.707l-4.596 1.099a1 1 0 0 1-1.192-1.2l1.099-4.596a1 1 0 0 1 .283-.495l7.071-7.071L12.293 6.293l-7.071 7.071a1 1 0 0 1-.495.283L.132 14.747a1 1 0 0 0 1.2 1.192l1.099-4.596 8.525-2.038z" /></svg>
                                </div>
                                <span className="text-white font-bold text-lg">{totalHours.toLocaleString()}</span> HOURS
                            </div>
                            <div className="h-1 w-1 rounded-full bg-zinc-600"></div>
                            <span className="text-brand-green font-bold">ONLINE</span>
                        </div>
                    </div>

                    {/* Big Rank Badge (Right Side) */}
                    {/* Text Rank (Right Side) */}
                    <div className="hidden md:flex flex-col items-end">
                        <div className="text-zinc-500 font-bold tracking-widest text-sm mb-[-10px] z-10 uppercase">Current Rank</div>
                        <div className="text-5xl md:text-7xl leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 tracking-tighter drop-shadow-2xl text-right animate-in fade-in slide-in-from-right duration-700">
                            {getRankForElo(rating).name}
                        </div>
                        <div className="text-brand-green font-mono text-xl tracking-wider font-bold mt-2">
                            {rating} ELO
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. STATS ROW - Compact Stats + Rating History */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                    label="Win Rate"
                    value={`${((totalWins + totalLosses) > 0 ? (totalWins / (totalWins + totalLosses) * 100) : 0).toFixed(1)}%`}
                    subDetail={`${totalWins}W - ${totalLosses}L`}
                    highlight={((totalWins + totalLosses) > 0 ? (totalWins / (totalWins + totalLosses) * 100) : 0) >= 50}
                    themeColors={themeColors}
                    isPremium={isPremium}
                />
                <StatCard
                    label="K/D Ratio"
                    value={`${(totalDeaths > 0 ? (totalKills / totalDeaths) : totalKills).toFixed(2)}`}
                    themeColors={themeColors}
                    isPremium={isPremium}
                />
                <StatCard
                    label="Total MVPs"
                    value={totalMvps.toLocaleString()}
                    themeColors={themeColors}
                    isPremium={isPremium}
                />
                {/* Rating History - Compact inline */}
                <div
                    className="p-3 rounded-xl border transition-all group relative overflow-hidden"
                    style={{
                        backgroundColor: isPremium ? `${themeColors.primary}08` : 'rgba(24, 24, 27, 0.5)',
                        borderColor: isPremium ? `${themeColors.primary}30` : 'rgba(255, 255, 255, 0.05)',
                    }}
                >
                    {isPremium && (
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{ background: `radial-gradient(circle at center, ${themeColors.glow}, transparent 70%)` }}
                        />
                    )}
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1 text-zinc-500 group-hover:text-zinc-400 relative z-10">Rating</div>
                    {ratingHistory && ratingHistory.length > 0 ? (
                        <div className="flex items-end justify-between gap-0.5 h-12 relative z-10">
                            {ratingHistory.slice(-12).map((h, i) => {
                                const max = Math.max(...ratingHistory);
                                const min = Math.min(...ratingHistory);
                                const range = max - min || 1;
                                const heightPercent = 20 + ((h - min) / range) * 80;
                                return (
                                    <div
                                        key={i}
                                        className="w-full rounded-t-sm transition-colors"
                                        style={{
                                            height: `${heightPercent}%`,
                                            backgroundColor: isPremium ? themeColors.primary : '#3f3f46',
                                        }}
                                        title={`${h} ELO`}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-12 flex items-center justify-center text-zinc-600 text-[10px] relative z-10">
                            No data
                        </div>
                    )}
                </div>
            </div>

            {/* 3. MEDALS & SIDEBAR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content Column */}
                <div className="md:col-span-2">
                    {/* MEDALS SECTION */}
                    {medals && medals.length > 0 && (
                        <div>
                            <h3 className="text-zinc-400 font-bold uppercase text-xs tracking-wider mb-3 flex items-center gap-2">
                                🏅 Medals & Achievements
                            </h3>
                            <MedalList medals={medals} userId={userId} isOwner={isOwner} />
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-3">
                    {/* Club Section - Now FIRST */}
                    {team && (
                        <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 min-h-[100px] flex flex-col justify-center relative overflow-hidden group/card">
                            {/* Banner Background */}
                            {team.bannerUrl && (
                                <>
                                    <Image
                                        src={team.bannerUrl}
                                        alt="Team Banner"
                                        fill
                                        className="object-cover opacity-20 blur-[1px] group-hover/card:opacity-30 transition-opacity"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-zinc-900/40" />
                                </>
                            )}
                            <div className="relative z-10">
                                <h3 className="text-zinc-400 font-bold uppercase text-xs tracking-widest mb-2">
                                    CLUB
                                </h3>
                                <Link href={`/teams/${team.tag}`} className="block group/team hover:bg-white/5 p-1.5 -m-1.5 rounded-lg transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-brand-green font-bold text-sm tracking-tight group-hover/team:text-brand-green/80 transition-colors">[{team.tag}]</span>
                                        <span className="text-white font-bold text-sm truncate group-hover/team:text-zinc-200 transition-colors">{team.name}</span>
                                    </div>
                                    <div className="flex -space-x-2 overflow-hidden">
                                        {team.members?.slice(0, 4).map((member) => (
                                            <div
                                                key={member.id}
                                                className="h-7 w-7 rounded-full border-2 border-zinc-900 bg-zinc-800 relative z-0 hover:z-10 hover:scale-110 transition-transform cursor-pointer overflow-hidden"
                                                title={member.name}
                                            >
                                                {member.image ? (
                                                    <Image src={member.image} alt={member.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-zinc-700 text-[8px] text-zinc-400 font-bold">
                                                        {member.name[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {(team.members?.length || 0) > 4 && (
                                            <div className="h-7 w-7 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[8px] text-zinc-400 font-bold">
                                                +{(team.members?.length || 0) - 4}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Rank Card - Now smaller */}
                    <div
                        className="rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden group transition-all duration-500 hover:scale-[1.02]"
                        style={{
                            backgroundColor: 'rgba(24, 24, 27, 0.6)',
                            borderColor: `${getRankForElo(rating).color}40`,
                            borderWidth: '1px',
                            boxShadow: `0 0 30px -10px ${getRankForElo(rating).color}20`
                        }}
                    >
                        {/* Dynamic Background Glow */}
                        <div
                            className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-700"
                            style={{
                                background: `radial-gradient(circle at center, ${getRankForElo(rating).color}, transparent 70%)`
                            }}
                        />
                        <h3 className="text-zinc-400 font-bold uppercase text-xs tracking-widest mb-2 z-10">Current Rank</h3>
                        {/* Smaller rank image: w-28 h-28 instead of w-40 h-40 */}
                        <div
                            className="relative w-28 h-28 animate-pulse z-10 transform group-hover:scale-105 transition-transform duration-500"
                            style={{
                                filter: `drop-shadow(0 0 20px ${getRankForElo(rating).color}60)`
                            }}
                        >
                            <Image
                                src={getRankForElo(rating).imagePath}
                                alt={getRankForElo(rating).name}
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div className="mt-2 z-10 text-center">
                            <div className="text-xl font-black tracking-tight drop-shadow-md" style={{ color: getRankForElo(rating).color }}>
                                {getRankForElo(rating).name}
                            </div>
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                {rating} ELO
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. MATCH HISTORY (Premium Feature) */}
            <MatchHistory
                matches={matchHistory}
                isPremium={isPremium || false}
                isOwner={isOwner}
            />
        </div>
    );
}

function StatCard({ label, value, subDetail, highlight = false, themeColors, isPremium }: { label: string, value: string, subDetail?: string, highlight?: boolean, themeColors?: any, isPremium?: boolean }) {
    return (
        <div
            className={`p-3 rounded-xl border transition-all group relative overflow-hidden ${highlight ? 'bg-brand-green text-black border-brand-green' : 'border-white/5 hover:border-white/20'}`}
            style={!highlight && isPremium && themeColors ? {
                backgroundColor: `${themeColors.primary}08`,
                borderColor: `${themeColors.primary}30`,
            } : !highlight ? {
                backgroundColor: 'rgba(24, 24, 27, 0.5)',
            } : undefined}
        >
            {/* Premium glow effect */}
            {!highlight && isPremium && themeColors && (
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at center, ${themeColors.glow}, transparent 70%)` }}
                />
            )}
            <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 relative z-10 ${highlight ? 'text-black/60' : 'text-zinc-500 group-hover:text-zinc-400'}`}>{label}</div>
            <div className={`text-2xl font-black relative z-10 ${highlight ? 'text-black' : 'text-white'}`}>{value}</div>
            {subDetail && <div className={`text-[10px] mt-0.5 font-medium relative z-10 ${highlight ? 'text-black/70' : 'text-zinc-500'}`}>{subDetail}</div>}
        </div>
    );
}

function WeaponBar({ name, usage, kills }: { name: string, usage: number, kills: string }) {
    return (
        <div className="flex items-center gap-4">
            <div className="w-24 text-sm font-bold text-zinc-300">{name}</div>
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-green to-emerald-600" style={{ width: `${usage}%` }}></div>
            </div>
            <div className="w-16 text-right text-xs text-zinc-500 font-mono">{kills}</div>
        </div>
    );
}

function getFlagEmoji(countryCode: string) {
    if (!countryCode || countryCode === "UNK") return "🏳️";
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}
