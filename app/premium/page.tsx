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

        try {
            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Checkout failed");
            }

            const data = await response.json();
            window.location.href = data.url;
        } catch (error) {
            console.error(error);
            setMsg("Error starting checkout. Please try again.");
            setLoading(false);
        }
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

                    {/* Message Display */}
                    {msg && (
                        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-200 text-sm font-medium">
                            {msg}
                        </div>
                    )}

                    <button
                        onClick={handleBuy}
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-black text-xl uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-yellow-500/20 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {loading ? "Processing..." : "UPGRADE NOW"}
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
