import { getTeamByTag } from "@/app/actions/getTeam";
import { leaveTeam } from "@/app/actions/team";
import { joinTeam } from "@/app/actions/team";
import Image from "next/image";
import { notFound } from "next/navigation";
import { LeaveTeamButton } from "@/components/LeaveTeamButton";
import { TeamManagementPanel } from "@/components/TeamManagementPanel";
import { JoinTeamButton } from "@/components/JoinTeamButton";
import { PremiumBadge } from "@/components/PremiumBadge";
import { ShinyText } from "@/components/ShinyText";
import { PremiumUsername } from "@/components/PremiumUsername";
import { getThemeColors } from "@/lib/themes";


// Helper for flags
function getFlagEmoji(countryCode: string | null) {
    if (!countryCode) return "🏳️";
    // If multiple codes like "MX,PE", just show first for now or split
    const firstCode = countryCode.split(',')[0];
    const codePoints = firstCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

type Props = {
    params: Promise<{ tag: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const dynamic = 'force-dynamic';

export default async function TeamProfilePage({ params, searchParams }: Props) {
    const { tag } = await params;
    const resolvedSearchParams = await searchParams;
    const team = await getTeamByTag(tag);

    if (!team) {
        return notFound();
    }

    const totalHours = 0; // sum members hours if we fetched them
    const avgRating = Math.round(team.members.reduce((acc, m) => acc + m.rating, 0) / (team.members.length || 1));

    const membersList = team.members.map(m => ({
        steamId: m.steamId || "",
        name: m.name || "Unknown",
        image: m.image || "",
        role: m.role
    }));

    // LOGIC FOR JOIN/OWNER
    const viewerSteamId = resolvedSearchParams?.steamId as string | undefined;
    // NOTE: In production, use `getServerSession` to get real steamId.
    // Currently relying on `? steamId =...` in URL for dev testing of "viewing as other user".
    const isOwner = viewerSteamId === team.ownerId;
    const isFull = team.members.length >= team.maxMembers;
    // Check if viewer is already in this team (to hide join button)
    const isMember = team.members.some(m => m.steamId === viewerSteamId);

    return (
        <div className="min-h-screen bg-black pt-32 pb-16 px-4">

            <div className="container mx-auto max-w-5xl">

                {/* HERO */}
                <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-900 mb-8 min-h-[300px] flex items-center">
                    {/* Background Layer */}
                    <div className="absolute inset-0 z-0">
                        {team.bannerUrl ? (
                            <Image src={team.bannerUrl} alt="Team Banner" fill className="object-cover opacity-40 blur-sm" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-zinc-950 to-zinc-900"></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent"></div>
                    </div>

                    <div className="relative z-10 p-10 flex flex-col md:flex-row items-center gap-8 w-full">
                        <div className="h-40 w-40 bg-zinc-800 rounded-full border-4 border-white/5 flex items-center justify-center text-6xl shadow-2xl relative overflow-hidden shrink-0">
                            {team.logoUrl ? (
                                <Image src={team.logoUrl} alt={team.name} fill className="object-cover" />
                            ) : (
                                <span>🛡️</span>
                            )}
                        </div>

                        <div className="text-center md:text-left flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-brand-green/10 text-brand-green text-xs font-bold uppercase tracking-widest mb-4 border border-brand-green/20">
                                {getFlagEmoji(team.countryCodes)} {team.countryCodes?.split(',').join(' / ') || "International"}
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase mb-2 drop-shadow-lg">
                                <span className="text-zinc-500 mr-4 font-normal not-italic">[{team.tag}]</span>
                                {team.name}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-zinc-300 font-medium font-mono drop-shadow-md">
                                <div><span className="text-white font-bold">{team.members.length}</span> MEMBERS</div>
                                <div className="hidden md:block w-1 h-1 bg-zinc-500 rounded-full"></div>
                                <div>AVG RATING: <span className="text-brand-green font-bold">{avgRating}</span></div>
                                <div className="hidden md:block w-1 h-1 bg-zinc-500 rounded-full"></div>

                                {team.inviteOnly && (
                                    <>
                                        <div className="flex items-center gap-2 text-red-400 font-bold uppercase text-xs tracking-widest">
                                            <span>🔒 Private</span>
                                        </div>
                                        <div className="hidden md:block w-1 h-1 bg-zinc-500 rounded-full"></div>
                                    </>
                                )}

                                <div className="flex items-center gap-2 text-sm text-red-400 hover:text-white transition-colors cursor-pointer">
                                    <LeaveTeamButton />
                                </div>

                                {!isFull && !team.inviteOnly && (
                                    <div className="ml-4">
                                        <JoinTeamButton
                                            teamId={team.id}
                                            teamName={team.name}
                                            members={team.members}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ROSTER */}
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-6 pl-2 border-l-4 border-brand-green">Active Roster</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {team.members.map((member) => (
                        <div key={member.name} className={`p-4 rounded-xl border ${member.isPremium ? 'bg-zinc-900 border-opacity-40' : member.steamId === team.ownerId ? 'bg-zinc-900 border-brand-green/30' : 'bg-zinc-900/50 border-white/5'} flex items-center gap-4`} style={member.isPremium ? { borderColor: `${getThemeColors(member.profileTheme).primary}60` } : {}}>
                            <div className="relative shrink-0 h-12 w-12">
                                <div
                                    className={`absolute inset-0 rounded-lg transition-all duration-300
                                        ${member.profileFrame === 'GOLD' ? 'border-2 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' :
                                            member.profileFrame === 'DIAMOND' ? 'border-2 border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]' :
                                                member.profileFrame === 'FIRE' ? 'border-2 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)] animate-pulse-slow' :
                                                    member.profileFrame === 'ICE' ? 'border-2 border-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.6)]' :
                                                        member.profileFrame === 'ELECTRIC' ? 'border-2 border-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.6)]' :
                                                            member.profileFrame === 'RAINBOW' ? 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500 p-[2px]' :
                                                                member.profileFrame === 'EMERALD' ? 'border-2 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' :
                                                                    member.profileFrame === 'RUBY' ? 'border-2 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]' :
                                                                        member.profileFrame === 'PLASMA' ? 'border-2 border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.6)] animate-pulse' :
                                                                            member.profileFrame === 'VOID' ? 'border-2 border-purple-900 shadow-[0_0_15px_rgba(88,28,135,0.8)]' :
                                                                                member.profileFrame === 'LEGENDARY' ? 'border-2 border-yellow-300 animate-pulse shadow-[0_0_15px_rgba(253,224,71,0.7)]' :
                                                                                    member.isPremium ? 'border-2 border-opacity-80 shadow-md' :
                                                                                        'border border-zinc-700'
                                        }
                                    `}
                                    style={member.isPremium && !['GOLD', 'DIAMOND', 'FIRE', 'ICE', 'ELECTRIC', 'RAINBOW', 'EMERALD', 'RUBY', 'PLASMA', 'VOID', 'LEGENDARY'].includes(member.profileFrame || '') ? {
                                        borderColor: getThemeColors(member.profileTheme).primary,
                                        boxShadow: `0 0 10px ${getThemeColors(member.profileTheme).glow}`
                                    } : undefined}
                                ></div>
                                <div className={`relative w-full h-full rounded-lg overflow-hidden ${member.profileFrame === 'RAINBOW' ? 'bg-zinc-900 m-[2px]' : ''}`}>
                                    {member.image && <Image src={member.image} alt={member.name || "??"} fill className="object-cover" />}
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-lg flex items-center gap-2">
                                        {member.isPremium ? (
                                            <PremiumUsername
                                                username={member.name || "Unknown"}
                                                isPremium={true}
                                                profileTheme={member.profileTheme}
                                                nameGradient={member.nameGradient}
                                                customFont={member.customFont}
                                                size="lg"
                                                showBadge={false}
                                                showGlow={false}
                                            />
                                        ) : (
                                            member.name
                                        )}
                                        {member.isPremium && <div className="text-xs">👑</div>}
                                    </span>
                                    {member.steamId === team.ownerId && <span className="text-[10px] bg-brand-green text-black px-1.5 py-0.5 rounded font-black uppercase">CPT</span>}
                                </div>
                                <div className="text-xs text-zinc-500 font-mono">{member.role} • {member.countryCode || "UNK"}</div>
                            </div>
                            <div className="ml-auto text-right">
                                <div className="text-brand-green font-bold font-mono">{member.rating}</div>
                                <div className="text-[10px] text-zinc-600 uppercase">ELO</div>
                            </div>
                        </div>
                    ))}

                    {/* Empty Slots */}
                    {Array.from({ length: Math.max(0, team.maxMembers - team.members.length) }).map((_, i) => (
                        <div key={i} className="p-4 rounded-xl border border-dashed border-white/5 bg-transparent flex items-center gap-4 opacity-50">
                            <div className="h-12 w-12 bg-white/5 rounded-lg flex items-center justify-center text-zinc-700 font-bold">?</div>
                            <div className="text-zinc-600 font-bold uppercase tracking-widest text-sm">Open Slot</div>
                        </div>
                    ))}
                </div>

                {/* OWNER TOOLS: Client component handles visibility */}
                <TeamManagementPanel
                    ownerSteamId={team.ownerId}
                    teamId={team.id}
                    currentLogo={team.logoUrl || ""}
                    currentBanner={team.bannerUrl || ""}
                    currentDesc={team.description || ""}
                    currentCountries={team.countryCodes || ""}
                    currentMaxMembers={team.maxMembers}
                    currentInviteOnly={team.inviteOnly}
                    members={membersList}
                />

            </div>
        </div>
    );
}
