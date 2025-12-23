import { Navbar } from "@/components/Navbar";
import GlobalChat from "@/components/GlobalChat";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OnlineUsersList from "@/components/OnlineUsersList";

export const dynamic = 'force-dynamic';

export default async function PlayPage() {
    const session = await getServerSession(authOptions);

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-brand-green selection:text-black pb-24 flex flex-col">
            <Navbar />

            <div className="relative pt-32 pb-12 flex-1 flex flex-col items-center px-6">
                {/* Background */}
                <div className="absolute inset-0 bg-[url('/l4d2_bg.jpg')] bg-cover bg-center opacity-10 mix-blend-overlay fixed"></div>

                <div className="relative z-10 w-full max-w-6xl space-y-8">
                    <div className="text-center space-y-4 mb-12">
                        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase text-white">
                            Matchmaking <span className="text-brand-green">Lobby</span>
                        </h1>
                        <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                            Chat with other players, look for a team, or wait for the next queue pop.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* LEFT COLUMN: Chat */}
                        <div className="lg:col-span-2">
                            <GlobalChat currentUser={(session as any)?.user} />
                        </div>

                        {/* RIGHT COLUMN: Queue/Status (Placeholder for now) */}
                        <div className="space-y-6">
                            {/* ONLINE USERS LIST */}
                            <OnlineUsersList />

                            <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="text-2xl">🔥</span> Queue Status
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-400">Players Online</span>
                                        <span className="text-brand-green font-mono font-bold">124</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-400">Active Matches</span>
                                        <span className="text-brand-green font-mono font-bold">8</span>
                                    </div>
                                    <div className="h-px bg-white/10"></div>
                                    <button className="w-full py-4 bg-brand-green hover:bg-lime-400 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-brand-green/20 transform hover:-translate-y-1">
                                        Find Match
                                    </button>
                                </div>
                            </div>

                            <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                                <h3 className="font-bold text-white mb-2">📢 Server News</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed">
                                    Don&apos;t forget to join our Discord for tournament announcements. Season 1 ends in 2 weeks!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
