"use client";

import { createTeam } from "@/app/actions/team";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateTeamForm() {
    const { data: session } = useSession();
    const router = useRouter();
    const [isPaying, setIsPaying] = useState(false);
    const [state, setState] = useState<{ success?: boolean; message?: string }>({});

    async function handleSubmit(formData: FormData) {
        if (!session?.user) return;

        setIsPaying(true);
        // Simulate payment UI delay here for effect, real check is on server
        await new Promise(r => setTimeout(r, 800));

        const res = await createTeam(formData);

        setIsPaying(false);
        setState(res);

        if (res.success) {
            // Redirect happens via server action usually, but we can force it here too just in case
            // actually revalidatePath does the refresh, but navigation to the new team page logic:
            // The server action returns success, but doesn't redirect. Let's redirect here.
            // Wait, we don't know the TAG easily unless we assume it's what was customized.
            // Ideally server action redirects. Let's just push to /teams for now.
            router.push("/teams");
        }
    }

    if (!session) {
        return <div className="text-center text-zinc-500">Please log in to create a team.</div>;
    }

    return (
        <form action={handleSubmit} className="space-y-8 max-w-lg mx-auto bg-zinc-900/50 p-8 rounded-2xl border border-white/5 shadow-2xl">
            {/* Hidden Owner ID */}
            {/* @ts-expect-error - steamId exists on session */}
            <input type="hidden" name="ownerSteamId" value={session.user.steamId} />

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 tracking-widest mb-2">Team Name</label>
                    <input
                        name="name"
                        type="text"
                        required
                        placeholder="e.g. The Zombie Slayers"
                        className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-brand-green focus:outline-none transition-colors font-bold"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-zinc-500 tracking-widest mb-2">Tag (Max 4)</label>
                        <input
                            name="tag"
                            type="text"
                            required
                            maxLength={4}
                            placeholder="SLYR"
                            className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-brand-green focus:outline-none transition-colors font-mono uppercase"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-zinc-500 tracking-widest mb-2">Country Code</label>
                        <input
                            name="countryCode"
                            type="text"
                            maxLength={2}
                            placeholder="MX"
                            className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-brand-green focus:outline-none transition-colors uppercase font-mono"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 tracking-widest mb-2">Logo URL (Optional)</label>
                    <input
                        name="logoUrl"
                        type="url"
                        placeholder="https://imgur.com/..."
                        className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-zinc-400 focus:border-brand-green focus:outline-none transition-colors text-sm"
                    />
                </div>
            </div>

            {/* Simulated Payment Stub */}
            <div className="bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
                <div>
                    <div className="text-emerald-400 font-bold text-sm uppercase tracking-wider">Registration Fee</div>
                    <div className="text-xs text-emerald-600/60">One-time payment for team creation.</div>
                </div>
                <div className="text-2xl font-black text-white">$5.00 <span className="text-sm font-medium text-zinc-500">USD</span></div>
            </div>

            {state.message && (
                <div className={`text-sm font-bold text-center ${state.success ? 'text-brand-green' : 'text-red-500'}`}>
                    {state.message}
                </div>
            )}

            <button
                type="submit"
                disabled={isPaying}
                className={`w-full py-4 rounded-xl font-black uppercase text-lg tracking-widest transition-all ${isPaying ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-brand-green text-black hover:bg-white hover:scale-[1.02] shadow-lg shadow-brand-green/20'}`}
            >
                {isPaying ? "Processing Payment..." : "Pay $5 & Create Team"}
            </button>

            <p className="text-center text-xs text-zinc-600">
                By creating a team, you agree to the Tournament Rules.<br />
                Payment is simulated for this demo.
            </p>
        </form>
    );
}
