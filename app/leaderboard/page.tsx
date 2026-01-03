import { LeaderboardTable } from "@/components/LeaderboardTable";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function LeaderboardPage() {
    return (
        <div className="min-h-screen bg-black font-sans selection:bg-brand-green selection:text-black">

            <main className="container mx-auto pt-32 pb-16 px-4">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-2">
                            Leaderboards
                        </h1>
                        <p className="text-zinc-400 max-w-lg">
                            Top performing players this season. Rankings are updated every 15 minutes.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 p-1 rounded-lg">
                        <button className="px-4 py-2 rounded-md bg-brand-green text-black font-bold text-sm shadow-lg">Global</button>
                        <button className="px-4 py-2 rounded-md text-zinc-400 hover:text-white font-medium text-sm transition-colors">Americas</button>
                        <button className="px-4 py-2 rounded-md text-zinc-400 hover:text-white font-medium text-sm transition-colors">Europe</button>
                    </div>
                </div>

                <LeaderboardTable />

            </main>
        </div>
    );
}
