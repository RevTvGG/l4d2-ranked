import { PREMIUM_ICONS } from "@/lib/premium";

export default function PremiumBenefits() {
    const benefits = [
        { icon: "✨", text: "Shiny Name & Badge" },
        { icon: "📜", text: "Full Match History Access" },
        { icon: "🛡️", text: "Private Stats Visibility" },
        { icon: "⚡", text: "Priority Report Handling" },
        { icon: "🎨", text: "Exclusive Profile Themes" },
        { icon: "👾", text: "Discord Verified Badge" },
        { icon: "📈", text: "Support the Platform" },
    ];

    return (
        <div className="bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border border-amber-500/30 p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-lg shadow-amber-500/20 mb-6 animate-pulse">
                    <span className="text-4xl">👑</span>
                </div>

                <h2 className="text-4xl font-black italic uppercase text-white mb-2 tracking-tighter">
                    Premium<span className="text-amber-500">Pass</span>
                </h2>

                <p className="text-zinc-400 max-w-sm mb-8">
                    Upgrade your presence. Stand out in the leaderboard. Unlock exclusive features.
                </p>

                <div className="w-full bg-zinc-900/50 rounded-2xl p-6 border border-white/5 mb-8 text-left">
                    <ul className="space-y-4">
                        {benefits.map((benefit, i) => (
                            <li key={i} className="flex items-center gap-3 text-zinc-300 font-medium">
                                <span className="text-amber-400 text-lg">{benefit.icon}</span>
                                {benefit.text}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex flex-col items-center gap-4 w-full">
                    <div className="text-center">
                        <span className="text-5xl font-black text-white">$4.00</span>
                        <span className="text-zinc-500 font-medium"> / month</span>
                    </div>

                    <a
                        href="/premium"
                        className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transform hover:-translate-y-1 transition-all text-center"
                    >
                        Upgrade Now
                    </a>
                </div>
            </div>
        </div>
    );
}
