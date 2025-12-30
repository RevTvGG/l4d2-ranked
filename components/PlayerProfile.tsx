import Image from "next/image";
import Link from "next/link";
import { MedalList } from "./MedalList";


import { PremiumBadge } from "./PremiumBadge";
import { ShinyText } from "./ShinyText";
import { RefreshAvatarButton } from "./RefreshAvatarButton";

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
    team,
    countryCode,
    isOwner = false,
    medals = [],
}: PlayerProfileProps) {
    const themeBg: Record<string, string> = {
        DEFAULT: "border-white/10 bg-zinc-900",
        GOLD: "border-yellow-500/50 bg-yellow-950/30 shadow-yellow-500/20",
        DIAMOND: "border-cyan-500/50 bg-cyan-950/30 shadow-cyan-500/20",
        RUBY: "border-red-500/50 bg-red-950/30 shadow-red-500/20",
        EMERALD: "border-emerald-500/50 bg-emerald-950/30 shadow-emerald-500/20",
        VOID: "border-purple-500/50 bg-purple-950/30 shadow-purple-500/20",
    };

    const containerStyle = themeBg[profileTheme] || themeBg.DEFAULT;

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">

            {/* 1. HERO SECTION */}
            <div className={`relative rounded-3xl overflow-hidden border shadow-2xl transition-all duration-500 ${containerStyle}`}>

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
                        <div className="w-full h-full bg-[url('/l4d2_bg.jpg')] bg-cover bg-center opacity-40 mix-blend-luminosity"></div>
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
                                    profileFrame === 'FIRE' ? 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)] animate-pulse-slow' :
                                        profileFrame === 'ICE' ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)]' :
                                            profileFrame === 'ELECTRIC' ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]' :
                                                profileFrame === 'RAINBOW' ? 'border-transparent bg-gradient-to-r from-red-500 via-green-500 to-blue-500 p-[3px]' :
                                                    isPremium ? 'border-amber-300 shadow-amber-500/50' : 'border-white/10 bg-zinc-800'}
                            `}
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


                                {/* 2. SKILL LEVEL */}
                                {skillLevel && (
                                    <span className="px-2.5 py-1 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                        <span className="opacity-70">
                                            {skillLevel === 'CASUAL' ? '☕' :
                                                skillLevel === 'SEMI_COMP' ? '⚔️' :
                                                    skillLevel === 'COMPETITIVE' ? '🏆' : '👽'}
                                        </span>
                                        {skillLevel.replace('_', ' ')}
                                    </span>
                                )}

                                {/* 4. MAIN SIDE */}
                                {mainSide && (
                                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${mainSide === 'INFECTED' ? 'bg-red-900/10 text-red-500 border-red-900/40' : 'bg-cyan-900/10 text-cyan-400 border-cyan-900/40'
                                        }`}>
                                        <span className="opacity-70">
                                            {mainSide === 'INFECTED' ? '🦠' : mainSide === 'SURVIVOR' ? '🧍' : '☯️'}
                                        </span>
                                        {mainSide === 'BOTH_SIDES' ? 'HYBRID' : mainSide}
                                    </span>
                                )}

                                {/* 5. WEAPON */}
                                {survivorWeapon && (
                                    <span className="px-2.5 py-1 rounded-full border border-zinc-700/50 bg-zinc-800/50 text-zinc-300 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                        <span className="opacity-70">
                                            {survivorWeapon === 'SMG' ? '🔫' : survivorWeapon === 'SHOTGUN' ? '💥' : '🔁'}
                                        </span>
                                        {survivorWeapon}
                                    </span>
                                )}

                                {/* 6. COMM */}
                                {communication && (
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
                            {customTitle && (
                                <span className={`text-sm font-bold uppercase tracking-widest mb-1 ${profileTheme === 'FIRE' ? 'text-orange-500' :
                                        profileTheme === 'ICE' ? 'text-cyan-400' :
                                            profileTheme === 'GOLD' ? 'text-yellow-400' :
                                                'text-brand-green'
                                    }`}>
                                    {customTitle}
                                </span>
                            )}
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter uppercase italic leading-none break-words max-w-full">
                                {isPremium ? (
                                    <span className="flex flex-wrap items-center gap-2">
                                        {nameGradient ? (
                                            <span className={`bg-gradient-to-r ${nameGradient} bg-clip-text text-transparent animate-gradient-x`}>
                                                {username}
                                            </span>
                                        ) : (
                                            <ShinyText text={username} theme={profileTheme} />
                                        )}
                                        <PremiumBadge theme={profileTheme} />
                                    </span>
                                ) : (
                                    username
                                )}
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
                    <div className="hidden md:flex flex-col items-end">
                        <div className="text-zinc-500 font-bold tracking-widest text-sm mb-[-10px] z-10 uppercase">Current Rank</div>
                        <div className="text-6xl md:text-8xl leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 tracking-tighter drop-shadow-2xl truncate max-w-[300px] text-right">
                            {rank}
                        </div>
                        <div className="text-brand-green font-mono text-xl tracking-wider font-bold">
                            {rating} ELO
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. STATS GRID & WEAPONS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Main Stats Column */}
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <StatCard label="Win Rate" value={`${winRate}%`} subDetail="Top 12%" />
                    <StatCard label="Headshot %" value="64.2%" subDetail="Above Avg" />
                    <StatCard label="ADR (Dmg/Round)" value="450" subDetail="+25 vs Last Season" highlight />
                    <StatCard label="MVPs" value="1,240" />

                    {/* Fav Weapon Section */}
                    <div className="col-span-2 bg-zinc-900/50 border border-white/5 rounded-2xl p-6 mt-4">
                        <h3 className="text-zinc-400 font-bold uppercase text-sm tracking-wider mb-6">Most Used Weapons</h3>
                        <div className="space-y-4">
                            <WeaponBar name="AK-47" usage={42} kills="12,400" />
                            <WeaponBar name="Sniper Rifle" usage={28} kills="8,200" />
                            <WeaponBar name="Pump Shotgun" usage={15} kills="4,100" />
                        </div>
                    </div>

                    {/* MEDALS SECTION */}
                    {medals && medals.length > 0 && (
                        <div className="col-span-2 mt-6">
                            <h3 className="text-zinc-400 font-bold uppercase text-sm tracking-wider mb-4 flex items-center gap-2">
                                🏅 Medals & Achievements
                            </h3>
                            <MedalList medals={medals} userId={userId} isOwner={isOwner} />
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-4">
                    {/* Rank History Graph Placeholder */}
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 h-48 flex flex-col justify-between">
                        <h3 className="text-zinc-400 font-bold uppercase text-sm tracking-widest">Rating History</h3>
                        <div className="flex-1 flex items-end justify-between gap-1 pt-4">
                            {[40, 55, 45, 60, 75, 65, 80].map((h, i) => (
                                <div key={i} className="w-full bg-zinc-800 rounded-t-sm hover:bg-brand-green transition-colors" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                    </div>

                    {/* Team Section - Only visible if has team */}
                    {team && (
                        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 min-h-[140px] flex flex-col justify-center relative overflow-hidden group/card">

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
                                <h3 className="text-zinc-400 font-bold uppercase text-sm tracking-widest mb-4">
                                    CLUB
                                </h3>

                                <Link href={`/teams/${team.tag}`} className="block group/team hover:bg-white/5 p-2 -m-2 rounded-xl transition-colors">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-brand-green font-bold text-lg tracking-tight group-hover/team:text-brand-green/80 transition-colors">[{team.tag}]</span>
                                        <span className="text-white font-bold text-lg truncate group-hover/team:text-zinc-200 transition-colors">{team.name}</span>
                                    </div>
                                    <div className="flex -space-x-3 overflow-hidden pl-1">
                                        {team.members?.map((member) => (
                                            <div
                                                key={member.id}
                                                className="h-10 w-10 rounded-full border-2 border-zinc-900 bg-zinc-800 relative z-0 hover:z-10 hover:scale-110 transition-transform cursor-pointer overflow-hidden group"
                                                title={member.name}
                                            >
                                                {member.image ? (
                                                    <Image src={member.image} alt={member.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-zinc-700 text-[10px] text-zinc-400 font-bold">
                                                        {member.name[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, subDetail, highlight = false }: { label: string, value: string, subDetail?: string, highlight?: boolean }) {
    return (
        <div className={`p-6 rounded-2xl border transition-all group ${highlight ? 'bg-brand-green text-black border-brand-green' : 'bg-zinc-900/50 border-white/5 hover:border-white/20'}`}>
            <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${highlight ? 'text-black/60' : 'text-zinc-500 group-hover:text-brand-green'}`}>{label}</div>
            <div className={`text-4xl font-black ${highlight ? 'text-black' : 'text-white'}`}>{value}</div>
            {subDetail && <div className={`text-sm mt-1 font-medium ${highlight ? 'text-black/70' : 'text-zinc-500'}`}>{subDetail}</div>}
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
