import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

async function getAnnouncements() {
  try {
    const announcements = await prisma.announcement.findMany({
      where: {
        active: true,
        location: { in: ['HOME', 'GLOBAL'] },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    });
    return announcements;
  } catch (e) {
    console.error('Failed to fetch announcements:', e);
    return [];
  }
}

async function getStats() {
  try {
    const [playerCount, matchCount] = await Promise.all([
      prisma.user.count(),
      prisma.match.count({ where: { status: 'COMPLETED' } })
    ]);
    return { playerCount, matchCount };
  } catch (e) {
    return { playerCount: 0, matchCount: 0 };
  }
}

export default async function Home() {
  const [announcements, stats] = await Promise.all([
    getAnnouncements(),
    getStats()
  ]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-black text-white overflow-x-hidden">

      {/* =============== HERO SECTION =============== */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/l4d2_hero_bg.jpg"
            alt="L4D2 Background"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 text-center space-y-8">
          {/* Animated Badge */}
          <div className="inline-flex items-center rounded-full border border-brand-green/50 bg-brand-green/10 px-4 py-2 text-sm text-brand-green animate-fade-in-up backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-brand-green mr-2 animate-pulse" />
            <span className="font-bold uppercase tracking-wider">Season 1 is Live</span>
          </div>

          {/* Main Title */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black italic uppercase tracking-tighter leading-none animate-fade-in-up animation-delay-100">
            L4D2<span className="text-brand-green">RANKED</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-zinc-300 max-w-3xl mx-auto font-medium animate-fade-in-up animation-delay-200">
            The <span className="text-brand-green font-bold">Competitive Standard</span> for Left 4 Dead 2.
            <br className="hidden md:block" />
            Fair matches. Skill-based ranking. Real competition.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 animate-fade-in-up animation-delay-300">
            <Link
              href="/play"
              className="group relative h-14 px-10 flex items-center justify-center bg-brand-green text-black rounded-xl font-black text-lg uppercase tracking-wider overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(34,197,94,0.4)]"
            >
              <span className="relative z-10">Start Competing</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </Link>
            <Link
              href="/leaderboard"
              className="h-14 px-10 flex items-center justify-center border-2 border-white/20 bg-white/5 text-white rounded-xl font-bold text-lg uppercase tracking-wider backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/40 hover:scale-105"
            >
              View Leaderboards
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-8 pt-8 animate-fade-in-up animation-delay-400">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-brand-green">{stats.playerCount}</div>
              <div className="text-xs uppercase tracking-widest text-zinc-500">Players</div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-brand-green">{stats.matchCount}</div>
              <div className="text-xs uppercase tracking-widest text-zinc-500">Matches</div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-brand-green">4v4</div>
              <div className="text-xs uppercase tracking-widest text-zinc-500">Versus</div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* =============== ANNOUNCEMENTS =============== */}
      {announcements.length > 0 && (
        <section className="relative py-16 bg-gradient-to-b from-black to-zinc-950">
          <div className="container mx-auto px-6">
            <div className="space-y-6">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-6 rounded-2xl border backdrop-blur-sm ${ann.type === 'WARNING' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200' :
                    ann.type === 'MAINTENANCE' ? 'bg-red-500/10 border-red-500/30 text-red-200' :
                      'bg-brand-green/10 border-brand-green/30 text-green-200'
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">
                      {ann.type === 'WARNING' ? '⚠️' : ann.type === 'MAINTENANCE' ? '🔧' : '📢'}
                    </span>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{ann.title}</h3>
                      <p className="opacity-80">{ann.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =============== FEATURES =============== */}
      <section className="relative py-24 bg-zinc-950">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tight mb-4">
              Why <span className="text-brand-green">L4D2 Ranked</span>?
            </h2>
            <p className="text-zinc-500 max-w-2xl mx-auto">
              Built by competitive players, for competitive players.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🏆",
                title: "Skill Rating System",
                desc: "ELO-based ranking adapted for 4v4 versus gameplay. Climb the ladder and prove your skill."
              },
              {
                icon: "📊",
                title: "Advanced Statistics",
                desc: "Track average damage, skeets, pounces, and tank control. Every round matters."
              },
              {
                icon: "🛡️",
                title: "Fair Play Guaranteed",
                desc: "Server-side verification and demo parsing. Cheaters get banned, period."
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative p-8 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-brand-green/30 transition-all duration-500 hover:-translate-y-2"
              >
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-green transition-colors">{feature.title}</h3>
                <p className="text-zinc-500 leading-relaxed">{feature.desc}</p>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============== CTA SECTION =============== */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-green/10 via-transparent to-brand-green/10" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tight mb-6">
            Ready to <span className="text-brand-green">Compete</span>?
          </h2>
          <p className="text-zinc-400 text-lg mb-8 max-w-xl mx-auto">
            Join hundreds of players in the most competitive L4D2 experience.
          </p>
          <Link
            href="/play"
            className="inline-flex h-16 px-12 items-center justify-center bg-brand-green text-black rounded-xl font-black text-xl uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(34,197,94,0.5)]"
          >
            Find a Match
          </Link>
        </div>
      </section>

      {/* =============== FOOTER =============== */}
      <footer className="border-t border-white/5 py-12 bg-black">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-2xl font-black tracking-tighter">
              L4D2<span className="text-brand-green">RANKED</span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
              <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
              <Link href="/teams" className="hover:text-white transition-colors">Teams</Link>
              <Link href="/bans" className="hover:text-white transition-colors">Bans</Link>
            </nav>
            <p className="text-zinc-600 text-xs">
              © 2025 L4D2 Ranked. Not affiliated with Valve Corporation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
