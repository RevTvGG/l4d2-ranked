"use client";

import { useSession } from "next-auth/react";
import { buyPremium } from "@/app/actions/user";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShinyText } from "@/components/ShinyText";

export default function PremiumPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const handleBuy = async () => {
        if (!session) return router.push("/api/auth/signin");
        setLoading(true);

        // Simulating Payment Delay
        await new Promise(r => setTimeout(r, 1500));

        const res = await buyPremium();
        setMsg(res.message);
        if (res.success) {
            router.refresh();
            // Redirect to profile after success
            if (session.user?.name) router.push(`/profile/${session.user.name}?steamId=${session.user.steamId}`);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-[url('/l4d2_bg.jpg')] bg-cover bg-center bg-blend-overlay bg-black/80">
            <div className="max-w-md w-full bg-zinc-900/90 backdrop-blur-xl border border-yellow-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden group">

                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/10 via-transparent to-purple-500/10 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                <div className="relative z-10 space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl mx-auto flex items-center justify-center text-4xl shadow-xl rotate-3 group-hover:rotate-6 transition-transform">
                        👑
                    </div>

                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                        <ShinyText text="PREMIUM PASS" theme="GOLD" />
                    </h1>

                    <p className="text-zinc-400 font-medium leading-relaxed">
                        Upgrade your presence. Stand out in the leaderboard. Unlock exclusive features.
                    </p>

                    <div className="space-y-3 text-left bg-black/20 p-6 rounded-xl border border-white/5">
                        <Feature icon="✨" text="Shiny Name & Badge" />
                        <Feature icon="📜" text="Full Match History Access" />
                        <Feature icon="🛡️" text="Private Stats Visibility" />
                        <Feature icon="⚡" text="Priority Report Handling" />
                        <Feature icon="🎨" text="Exclusive Profile Themes" />
                        <Feature icon="👾" text="Discord Verified Badge" />
                        <Feature icon="📈" text="Support the Platform" />
                    </div>

                    <div className="text-3xl font-black text-white">
                        $4.00 <span className="text-sm font-bold text-zinc-500 normal-case">/ month</span>
                    </div>

                    {/* DISABLED NOTICE */}
                    <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-200 text-sm font-medium">
                        ⚠️ Premium features are currently <strong>disabled</strong> for maintenance.
                    </div>

                    <button
                        disabled={true}
                        className="w-full py-4 bg-zinc-800 text-zinc-500 font-black text-xl uppercase tracking-widest rounded-xl cursor-not-allowed border border-white/5"
                    >
                        TEMPORARILY UNAVAILABLE
                    </button>
                </div>
            </div>
        </div>
    );
}

function Feature({ icon, text }: { icon: string, text: string }) {
    return (
        <div className="flex items-center gap-3 text-zinc-300 font-bold text-sm">
            <span className="text-lg">{icon}</span> {text}
        </div>
    );
}
