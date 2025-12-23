import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-16 px-6 text-center">
        <div className="max-w-4xl space-y-8">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-brand-green mb-4">
            <span className="flex h-2 w-2 rounded-full bg-brand-green mr-2 animate-pulse"></span>
            Season 1 is Live
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white">
            The Competitive Standard <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-500">
              For Left 4 Dead 2
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-400">
            Climb the ladder, track your stats, and compete against the best.
            Automated matchmaking, sophisticated ranking, and detailed performance analysis.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/play" className="h-12 px-8 flex items-center justify-center bg-brand-green text-black rounded-lg font-bold text-lg hover:bg-lime-400 transition-all transform hover:scale-105">
              Start Competing
            </Link>
            <Link href="/leaderboard" className="h-12 px-8 flex items-center justify-center border border-zinc-700 bg-zinc-900/50 text-white rounded-lg font-medium hover:bg-zinc-800 transition-all">
              View Leaderboards
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full max-w-6xl text-left">
          {[
            { title: "Skill Rating", desc: "ELO-based ranking system adapted for 4v4 versus gameplay." },
            { title: "Advanced Stats", desc: "Track average damage, skeets, pounces, and tank control." },
            { title: "Anti-Cheat", desc: "Server-side verification and demo parsing technology." }
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-2xl bg-brand-card border border-white/5 hover:border-brand-green/30 transition-colors group">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-green transition-colors">{feature.title}</h3>
              <p className="text-zinc-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-zinc-600 text-sm">
        <p>&copy; 2025 L4D2 Ranked. Not affiliated with Valve Corporation.</p>
      </footer>
    </div>
  );
}
