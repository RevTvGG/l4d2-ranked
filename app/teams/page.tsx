import { Navbar } from "@/components/Navbar";
import { TeamCard } from "@/components/TeamCard";
import { getTeams } from "@/app/actions/team";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function TeamsPage() {
    const teams = await getTeams();

    return (
        <div className="min-h-screen bg-black pt-32 pb-16 px-4">
            <Navbar />

            <div className="container mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                    <div>
                        <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-2">Active Teams</h1>
                        <p className="text-zinc-400">Compete for the top spot. Join a squad or create your own legacy.</p>
                    </div>
                    <button disabled className="px-6 py-3 bg-zinc-800 text-zinc-500 font-black uppercase tracking-wider rounded cursor-not-allowed border border-white/10 flex flex-col items-center">
                        <span>+ Create Team</span>
                        <span className="text-[10px] font-normal opacity-60">Disabled</span>
                    </button>
                </div>

                {teams.length === 0 ? (
                    <div className="text-center py-24 border border-dashed border-zinc-800 rounded-3xl">
                        <div className="text-6xl mb-4">🏚️</div>
                        <h2 className="text-2xl font-bold text-white mb-2">No Teams Found</h2>
                        <p className="text-zinc-500 mb-6">The arena is empty. Be the first to form a squad.</p>
                        <span className="text-zinc-600 font-bold cursor-not-allowed">Creation Disabled Temporarily</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teams.map((team, index) => (
                            <TeamCard
                                key={team.id}
                                name={team.name}
                                tag={team.tag}
                                logoUrl={team.logoUrl || undefined}
                                memberCount={team._count.members}
                                rating={team.rating}
                                rank={index + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
