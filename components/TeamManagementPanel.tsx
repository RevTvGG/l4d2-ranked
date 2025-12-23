"use client";

import { kickMember, updateTeam, buySlot } from "@/app/actions/team";
import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface Member {
    steamId: string;
    name: string;
    image: string;
    role: string;
}

interface Props {
    ownerSteamId: string;
    teamId: string;
    currentLogo: string;
    currentDesc: string;
    currentCountries: string;
    currentMaxMembers: number;
    members: Member[];
}

export function TeamManagementPanel({ ownerSteamId, teamId, currentLogo, currentDesc, currentCountries, currentMaxMembers, members }: Props) {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [msg, setMsg] = useState("");
    const [buying, setBuying] = useState(false);

    // @ts-expect-error - steamId custom field
    const currentUserSteamId = session?.user?.steamId;

    // Only show if current user is owner
    if (currentUserSteamId !== ownerSteamId) return null;

    async function handleKick(memberId: string) {
        if (!confirm("Kick this player?")) return;
        const res = await kickMember(ownerSteamId, memberId);
        setMsg(res.message);
    }

    async function handleBuy() {
        if (!confirm("Buy 1 extra slot for $10?")) return;
        setBuying(true);
        try {
            const res = await buySlot(ownerSteamId, teamId);
            setMsg(res.message);
        } catch (err) {
            console.error(err);
            setMsg("Error buying slot.");
        } finally {
            setBuying(false);
        }
    }

    async function handleUpdate(formData: FormData) {
        const res = await updateTeam(ownerSteamId, formData);
        setMsg(res.message);
        if (res.success) setIsOpen(false);
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 bg-brand-green text-black font-black px-6 py-4 rounded-full shadow-2xl hover:scale-105 transition-transform z-50 flex items-center gap-2"
            >
                ⚙️ MANAGE TEAM
            </button>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-950">
                    <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Team Management</h2>
                    <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">✕ Close</button>
                </div>

                <div className="overflow-y-auto p-6 space-y-8">

                    {msg && <div className="p-3 bg-white/10 text-white rounded font-bold text-center">{msg}</div>}

                    {/* Section 0: Invite Link */}
                    <section className="space-y-2 bg-brand-green/10 p-4 rounded-lg border border-brand-green/20">
                        <h3 className="text-brand-green font-bold uppercase tracking-widest text-xs">Invite Players</h3>
                        <p className="text-zinc-400 text-xs mb-2">Share this link to let players join directly.</p>
                        <div className="flex gap-2">
                            <code className="flex-1 bg-black p-2 rounded text-xs text-white border border-white/10 overflow-hidden text-nowrap">
                                {typeof window !== 'undefined' ? window.location.href : "Loading..."}
                            </code>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    setMsg("Link copied!");
                                }}
                                className="bg-brand-green text-black text-xs font-bold px-3 rounded hover:brightness-110"
                            >
                                COPY
                            </button>
                        </div>
                    </section>

                    {/* Section 0.5: Capacity */}
                    <section className="bg-zinc-950 border border-brand-green/20 p-4 rounded flex items-center justify-between">
                        <div>
                            <h3 className="text-brand-green font-bold uppercase text-xs">Team Capacity</h3>
                            <div className="text-zinc-400 text-xs">
                                Using <span className="text-white font-bold">{members.length}</span> of <span className="text-white font-bold">{currentMaxMembers}</span> slots
                            </div>
                        </div>
                        <button
                            onClick={handleBuy}
                            disabled={buying || currentMaxMembers >= 10}
                            className="bg-zinc-800 hover:bg-brand-green hover:text-black text-white px-3 py-1.5 rounded text-xs font-bold transition-colors disabled:opacity-50"
                        >
                            {buying ? "..." : "+1 SLOT ($5)"}
                        </button>
                    </section>

                    {/* Section 1: Details */}
                    <section className="space-y-4">
                        <h3 className="text-brand-green font-bold uppercase tracking-widest text-xs">Edit Details</h3>
                        <form action={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 mb-1">Logo URL</label>
                                <input name="logoUrl" defaultValue={currentLogo} className="w-full bg-black border border-zinc-800 rounded p-2 text-white text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-1">Description</label>
                                    <input name="description" defaultValue={currentDesc} placeholder="Team Bio..." className="w-full bg-black border border-zinc-800 rounded p-2 text-white text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-1">Countries (ISO)</label>
                                    <input name="countryCodes" defaultValue={currentCountries} placeholder="MX,PE,AR" className="w-full bg-black border border-zinc-800 rounded p-2 text-white text-sm" />
                                </div>
                            </div>
                            <button type="submit" className="px-4 py-2 bg-zinc-800 hover:bg-white hover:text-black text-white rounded text-sm font-bold transition-colors">Save Changes</button>
                        </form>
                    </section>

                    {/* Section 2: Roster */}
                    <section className="space-y-4">
                        <h3 className="text-red-500 font-bold uppercase tracking-widest text-xs">Roster Management</h3>
                        <div className="space-y-2">
                            {members.map(m => (
                                <div key={m.steamId} className="flex items-center justify-between bg-zinc-950 p-3 rounded border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-zinc-800 rounded overflow-hidden relative">
                                            {m.image && <Image src={m.image} alt={m.name} fill className="object-cover" />}
                                        </div>
                                        <span className={`font-bold text-sm ${m.steamId === ownerSteamId ? 'text-brand-green' : 'text-zinc-300'}`}>
                                            {m.name} {m.steamId === ownerSteamId && "(You)"}
                                        </span>
                                    </div>

                                    {m.steamId !== ownerSteamId && (
                                        <button
                                            onClick={() => handleKick(m.steamId)}
                                            className="text-xs bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1 rounded font-bold transition-colors"
                                        >
                                            KICK
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
