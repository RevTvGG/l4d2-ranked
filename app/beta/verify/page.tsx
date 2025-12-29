"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { redeemInviteCode, checkBetaAccess } from "@/app/actions/invite";
import { Lock, KeyRound, Loader2, CheckCircle, XCircle, Shield, Sparkles } from "lucide-react";
import Link from "next/link";

export default function BetaVerifyPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [checkingAccess, setCheckingAccess] = useState(true);

    // Check if user already has access
    useEffect(() => {
        async function check() {
            if (status === "authenticated") {
                const hasAccess = await checkBetaAccess();
                if (hasAccess) {
                    router.replace("/");
                } else {
                    setCheckingAccess(false);
                }
            } else if (status === "unauthenticated") {
                router.replace("/");
            }
        }
        check();
    }, [status, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        setLoading(true);
        setError("");

        const result = await redeemInviteCode(code);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            setSuccess(true);
            setTimeout(() => {
                router.replace("/");
            }, 2000);
        }
    };

    if (status === "loading" || checkingAccess) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-green/5 via-black to-black"></div>
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>

            {/* Floating particles */}
            <div className="absolute top-20 left-20 w-2 h-2 bg-brand-green/30 rounded-full animate-pulse"></div>
            <div className="absolute top-40 right-32 w-3 h-3 bg-brand-green/20 rounded-full animate-pulse delay-300"></div>
            <div className="absolute bottom-32 left-40 w-2 h-2 bg-brand-green/40 rounded-full animate-pulse delay-700"></div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo / Title */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-green/10 border border-brand-green/30 mb-6">
                        <Lock className="w-10 h-10 text-brand-green" />
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tight mb-2">
                        Closed <span className="text-brand-green">Beta</span>
                    </h1>
                    <p className="text-zinc-500 text-sm">
                        L4D2 Ranked is currently invite-only.
                    </p>
                </div>

                {success ? (
                    <div className="bg-brand-green/10 border border-brand-green rounded-2xl p-8 text-center animate-in zoom-in duration-300">
                        <CheckCircle className="w-16 h-16 text-brand-green mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-brand-green mb-2">Access Granted!</h2>
                        <p className="text-zinc-400 text-sm">Redirecting you to the platform...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                            <KeyRound className="w-5 h-5 text-brand-green" />
                            <span className="font-bold uppercase text-sm tracking-wider">Enter Invite Code</span>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="BETA-XXXX-XXXX"
                                    maxLength={14}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-center text-xl font-mono tracking-widest placeholder:text-zinc-600 focus:outline-none focus:border-brand-green/50 focus:ring-2 focus:ring-brand-green/20 transition-all"
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                                    <XCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || code.length < 10}
                                className="w-full bg-brand-green hover:bg-brand-green/90 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Shield className="w-5 h-5" />
                                        Verify Access
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/5 text-center">
                            <p className="text-zinc-600 text-xs">
                                Don't have an invite code?{" "}
                                <Link href="/" className="text-brand-green hover:underline">
                                    Join our Discord
                                </Link>
                            </p>
                        </div>
                    </form>
                )}

                {/* Decorative footer */}
                <div className="mt-8 text-center">
                    <div className="inline-flex items-center gap-2 text-zinc-600 text-xs">
                        <Sparkles className="w-3 h-3" />
                        <span>Exclusive access for early testers</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
