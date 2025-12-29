'use client'

import { useState } from "react"
import { updatePreferences, updateTheme } from "@/app/actions/user"
import { useRouter } from "next/navigation"

export function ProfileEditForm({ user }: { user: any }) {
    const router = useRouter();
    const [msg, setMsg] = useState("");
    const [mainSide, setMainSide] = useState(user?.mainSide || "");
    const [weapon, setWeapon] = useState(user?.survivorWeapon || "");
    const [comm, setComm] = useState(user?.communication || "");
    const [skill, setSkill] = useState(user?.skillLevel || "");
    const [bio, setBio] = useState(user?.bio || "");

    async function handleSubmit(formData: FormData) {
        setMsg("Saving...");
        const res = await updatePreferences(formData);
        setMsg(res.message);
        if (res.success) {
            router.refresh(); // Refresh current route
            // Optional: redirect or just stay
        }
    }

    // Theme State
    const [currentTheme, setCurrentTheme] = useState(user?.profileTheme || "DEFAULT");
    const isPremium = user?.isPremium || false;

    async function handleThemeChange(theme: string) {
        if (!isPremium && theme !== "DEFAULT") {
            setMsg("Upgrade to Premium to unlock themes!");
            return;
        }
        setMsg(`Applying ${theme}...`);
        // Optimistic update
        setCurrentTheme(theme);

        const res = await updateTheme(theme);
        setMsg(res.message);
        if (res.success) {
            router.refresh();
        } else {
            // Revert if failed
            setCurrentTheme(user?.profileTheme || "DEFAULT");
        }
    }

    const themes = [
        { id: "DEFAULT", name: "Default", color: "bg-zinc-800 border-white/10" },
        { id: "GOLD", name: "Gold", color: "bg-yellow-950/50 border-yellow-500/50 text-yellow-500" },
        { id: "DIAMOND", name: "Diamond", color: "bg-cyan-950/50 border-cyan-500/50 text-cyan-400" },
        { id: "RUBY", name: "Ruby", color: "bg-red-950/50 border-red-500/50 text-red-500" },
        { id: "EMERALD", name: "Emerald", color: "bg-emerald-950/50 border-emerald-500/50 text-emerald-500" },
        { id: "VOID", name: "Void", color: "bg-purple-950/50 border-purple-500/50 text-purple-500" },
    ];

    return (
        <div className="max-w-xl mx-auto space-y-8">

            {/* THEME SELECTOR (Premium) */}
            <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-2">
                        🎨 Profile Theme
                        {!isPremium && <span className="text-[10px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-bold uppercase">PREMIUM ONLY (PREVIEW)</span>}
                    </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {themes.map((t) => (
                        <div
                            key={t.id}
                            onClick={() => handleThemeChange(t.id)}
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${t.color} ${currentTheme === t.id ? 'ring-2 ring-white scale-105' : 'opacity-80 hover:opacity-100'}`}
                        >
                            <div className="font-bold text-sm uppercase tracking-wider text-center">{t.name}</div>
                        </div>
                    ))}
                </div>
                {!isPremium && (
                    <div className="text-xs text-zinc-500 text-center pt-2">
                        <a href="/premium" className="text-brand-green hover:underline font-bold">Get Premium</a> to unlock these styles.
                    </div>
                )}
            </div>

            <form action={handleSubmit} className="space-y-8 bg-zinc-900 border border-white/10 p-8 rounded-3xl shadow-xl">
                {msg && (
                    <div className={`p-4 rounded-xl text-center font-bold ${msg.includes("updated") || msg.includes("Activ") || msg.includes("Apply") ? "bg-brand-green/20 text-brand-green" : "bg-red-500/20 text-red-500"}`}>
                        {msg}
                    </div>
                )}

                {/* QUESTION 1 */}
                <div className="space-y-4">
                    <h3 className="text-xl font-black text-white italic uppercase">1. What do you play best?</h3>
                    <input type="hidden" name="mainSide" value={mainSide} />

                    <div className="grid grid-cols-3 gap-4">
                        <SelectionCard
                            label="Survivor"
                            emoji="🧍"
                            selected={mainSide === "SURVIVOR"}
                            onClick={() => setMainSide("SURVIVOR")}
                        />
                        <SelectionCard
                            label="Infected"
                            emoji="🦠"
                            selected={mainSide === "INFECTED"}
                            onClick={() => setMainSide("INFECTED")}
                        />
                        <SelectionCard
                            label="Both"
                            emoji="☯️"
                            selected={mainSide === "BOTH"}
                            onClick={() => setMainSide("BOTH")}
                        />
                    </div>
                </div>

                {/* QUESTION 2 (Conditional) */}
                {(mainSide === "SURVIVOR" || mainSide === "BOTH") && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                        <h3 className="text-xl font-black text-white italic uppercase">2. Preferred Weapon?</h3>
                        <input type="hidden" name="survivorWeapon" value={weapon} />

                        <div className="grid grid-cols-3 gap-4">
                            <SelectionCard
                                label="SMG"
                                emoji="🔫"
                                selected={weapon === "SMG"}
                                onClick={() => setWeapon("SMG")}
                            />
                            <SelectionCard
                                label="Shotgun"
                                emoji="💥"
                                selected={weapon === "SHOTGUN"}
                                onClick={() => setWeapon("SHOTGUN")}
                            />
                            <SelectionCard
                                label="Flexible"
                                emoji="🔁"
                                selected={weapon === "BOTH"}
                                onClick={() => setWeapon("BOTH")}
                            />
                        </div>
                    </div>
                )}

                {/* QUESTION 3: Communication */}
                <div className="space-y-4">
                    <h3 className="text-xl font-black text-white italic uppercase">3. Communication Style</h3>
                    <input type="hidden" name="communication" value={comm} />
                    <div className="grid grid-cols-2 gap-4">
                        <SelectionCard label="Mic Active" emoji="🎙️" selected={comm === "MIC_ACTIVE"} onClick={() => setComm("MIC_ACTIVE")} />
                        <SelectionCard label="Only Info" emoji="🎧" selected={comm === "ONLY_INFO"} onClick={() => setComm("ONLY_INFO")} />
                        <SelectionCard label="Listen Only" emoji="👂" selected={comm === "LISTEN"} onClick={() => setComm("LISTEN")} />
                        <SelectionCard label="No Mic" emoji="❌" selected={comm === "NO_MIC"} onClick={() => setComm("NO_MIC")} />
                    </div>
                </div>

                {/* QUESTION 4: Skill Level */}
                <div className="space-y-4">
                    <h3 className="text-xl font-black text-white italic uppercase">4. Perceived Skill Level</h3>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Does not affect matchmaking</p>
                    <input type="hidden" name="skillLevel" value={skill} />
                    <div className="grid grid-cols-2 gap-4">
                        <SelectionCard label="Casual" emoji="☕" selected={skill === "CASUAL"} onClick={() => setSkill("CASUAL")} />
                        <SelectionCard label="Semi-Comp" emoji="⚔️" selected={skill === "SEMI_COMP"} onClick={() => setSkill("SEMI_COMP")} />
                        <SelectionCard label="Competitive" emoji="🏆" selected={skill === "COMPETITIVE"} onClick={() => setSkill("COMPETITIVE")} />
                        <SelectionCard label="Tournament" emoji="👽" selected={skill === "TOURNAMENT"} onClick={() => setSkill("TOURNAMENT")} />
                    </div>
                </div>

                {/* QUESTION 5: Bio */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <h3 className="text-xl font-black text-white italic uppercase">5. Short Bio</h3>
                        <span className={`text-xs font-bold ${bio.length > 140 ? "text-red-500" : "text-zinc-500"}`}>{bio.length}/140</span>
                    </div>
                    <textarea
                        name="bio"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-brand-green resize-none text-sm"
                        rows={3}
                        placeholder="E.g. Main tank, prefer clean setups. No links."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        maxLength={140}
                    />
                </div>

                {/* STAFF BIO (Admins/Mods only) */}
                {['OWNER', 'ADMIN', 'MODERATOR'].includes(user.role) && (
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex justify-between items-end">
                            <h3 className="text-xl font-black text-brand-green italic uppercase flex items-center gap-2">
                                🛡️ Staff Bio <span className="text-xs bg-brand-green/20 px-2 py-0.5 rounded text-white not-italic">For FAQ Page</span>
                            </h3>
                            <span className={`text-xs font-bold ${typeof bio === 'string' && bio.length > 300 ? "text-red-500" : "text-zinc-500"}`}>Max 300</span>
                        </div>
                        <p className="text-sm text-zinc-400">
                            This description will appear in the "Meet the Team" section of the FAQ page alongside your avatar.
                        </p>
                        <textarea
                            name="staffBio"
                            className="w-full bg-zinc-900 border border-brand-green/30 rounded-xl p-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-brand-green resize-none text-sm"
                            rows={4}
                            placeholder="Write something about yourself as a staff member..."
                            defaultValue={user?.staffBio || ""}
                            maxLength={300}
                        />
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full bg-brand-green hover:bg-white hover:text-black text-black font-black text-lg py-4 rounded-xl shadow-lg shadow-brand-green/20 hover:scale-[1.02] transition-all"
                >
                    SAVE PROFILE
                </button>
            </form>
        </div>
    )
}

function SelectionCard({ label, emoji, selected, onClick }: { label: string, emoji: string, selected: boolean, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all hover:scale-105 active:scale-95 ${selected
                ? "bg-zinc-800 border-brand-green shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                : "bg-black/40 border-white/5 hover:border-white/20"
                }`}
        >
            <div className="text-3xl filter drop-shadow-lg">{emoji}</div>
            <div className={`font-bold uppercase tracking-wider text-xs ${selected ? "text-brand-green" : "text-zinc-500"}`}>
                {label}
            </div>
        </div>
    )
}
