'use client'

import { useState } from "react"
import { updatePreferences } from "@/app/actions/user"
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
        if (res.success) {
            // Optional: redirect or just stay
            window.location.href = `/profile/${user?.name || ''}`;
        } else {
            setMsg(res.message);
        }
    }

    // Theme State
    const [currentTheme, setCurrentTheme] = useState(user?.profileTheme || "DEFAULT");
    const [customTitle, setCustomTitle] = useState(user?.customTitle || "");
    const [profileGlow, setProfileGlow] = useState(user?.profileGlow || false);
    const [profileFrame, setProfileFrame] = useState(user?.profileFrame || "NONE");
    const [nameGradient, setNameGradient] = useState(user?.nameGradient || "");
    const [profileBanner, setProfileBanner] = useState(user?.profileBanner || "");
    const [profileColor, setProfileColor] = useState(user?.profileColor || "#ffffff");

    const isPremium = user?.isPremium || false;

    async function handleStyleChange(theme: string, color: string | null) {
        if (!isPremium && theme !== "DEFAULT") {
            setMsg("Upgrade to Premium to unlock styles!");
            return;
        }
        setCurrentTheme(theme);
        setProfileColor(color || "");
    }

    const STYLE_PRESETS = [
        { id: "DEFAULT", name: "Default", color: "#27272a", theme: "DEFAULT" },
        { id: "GOLD", name: "Gold", color: "#eab308", theme: "GOLD" },
        { id: "DIAMOND", name: "Diamond", color: "#22d3ee", theme: "DIAMOND" },
        { id: "RUBY", name: "Ruby", color: "#ef4444", theme: "RUBY" },
        { id: "EMERALD", name: "Emerald", color: "#10b981", theme: "EMERALD" },
        { id: "VOID", name: "Void", color: "#a855f7", theme: "VOID" },
    ];

    const GRADIENT_PRESETS = [
        { name: "Cotton Candy", class: "from-pink-500 via-purple-500 to-indigo-500" },
        { name: "Sunset", class: "from-orange-500 via-red-500 to-yellow-500" },
        { name: "Northern Lights", class: "from-teal-400 via-blue-500 to-purple-600" },
        { name: "Cyberpunk", class: "from-yellow-400 via-pink-500 to-cyan-500" },
        { name: "Monochrome", class: "from-gray-200 via-gray-400 to-gray-600" },
        { name: "Biohazard", class: "from-lime-400 via-green-500 to-emerald-600" },
    ];

    const COLOR_PRESETS = [
        { name: "White", hex: "#ffffff" },
        { name: "Green", hex: "#22c55e" },
        { name: "Red", hex: "#ef4444" },
        { name: "Blue", hex: "#3b82f6" },
        { name: "Yellow", hex: "#eab308" },
        { name: "Purple", hex: "#a855f7" },
        { name: "Pink", hex: "#ec4899" },
        { name: "Orange", hex: "#f97316" },
    ];

    return (
        <div className="max-w-xl mx-auto space-y-8">

            <form action={handleSubmit} className="space-y-8 bg-zinc-900 border border-white/10 p-8 rounded-3xl shadow-xl">

                {/* PREMIUM CUSTOMIZATION (Extended) */}
                {isPremium && (
                    <div className="bg-black/20 border border-amber-500/20 p-6 rounded-2xl space-y-8 mb-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-amber-500 italic uppercase flex items-center gap-2">
                                👑 Premium Customization
                            </h3>
                        </div>

                        {/* 1. Profile Style (Unified) */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider">Profile Style</label>
                            <input type="hidden" name="profileTheme" value={currentTheme} />
                            <input type="hidden" name="profileColor" value={profileColor} />

                            {/* Themes */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {STYLE_PRESETS.map((style) => (
                                    <div
                                        key={style.id}
                                        onClick={() => handleStyleChange(style.theme, null)}
                                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${currentTheme === style.theme && !profileColor ? 'bg-zinc-800 border-white ring-1 ring-white' : 'bg-black/20 border-white/10 hover:border-white/30'}`}
                                    >
                                        <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: style.color }}></div>
                                        <div className={`font-bold text-xs uppercase ${currentTheme === style.theme && !profileColor ? 'text-white' : 'text-zinc-500'}`}>{style.name}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Custom Colors */}
                            <div className="flex flex-wrap gap-3 pt-2">
                                {COLOR_PRESETS.map((preset) => (
                                    <div
                                        key={preset.hex}
                                        onClick={() => handleStyleChange("DEFAULT", preset.hex)}
                                        className={`w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-transform ${profileColor === preset.hex ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : ""}`}
                                        style={{ backgroundColor: preset.hex }}
                                        title={preset.name}
                                    />
                                ))}
                                <div className="flex items-center gap-2 relative group">
                                    <input
                                        type="color"
                                        value={profileColor || "#ffffff"}
                                        onChange={(e) => handleStyleChange("DEFAULT", e.target.value)}
                                        className="w-8 h-8 rounded-full cursor-pointer opacity-0 absolute inset-0 z-10"
                                    />
                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-tr from-white to-black border border-white/20 flex items-center justify-center text-[10px] text-black font-bold ${profileColor && !COLOR_PRESETS.find(p => p.hex === profileColor) ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : ""}`}>+</div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Profile Frame */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider">Avatar Frame</label>
                            <input type="hidden" name="profileFrame" value={profileFrame} />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {["NONE", "GOLD", "FIRE", "ICE", "ELECTRIC", "RAINBOW"].map((frame) => (
                                    <div
                                        key={frame}
                                        onClick={() => setProfileFrame(frame)}
                                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${profileFrame === frame ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-black/20 border-white/10 text-zinc-500 hover:border-white/30'}`}
                                    >
                                        <div className="font-bold text-xs uppercase text-center">{frame}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Custom Title & Name Gradient */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider">Custom Title</label>
                                <input
                                    type="text"
                                    name="customTitle"
                                    value={customTitle}
                                    onChange={(e) => setCustomTitle(e.target.value)}
                                    maxLength={30}
                                    placeholder="e.g. The King"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none"
                                />
                                <p className="text-[10px] text-zinc-600">Displayed below your name</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider">Profile Color</label>
                            <div className="flex flex-wrap gap-3">
                                {COLOR_PRESETS.map((color) => (
                                    <div
                                        key={color.hex}
                                        onClick={() => setProfileColor(color.hex)}
                                        className={`w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-transform ${profileColor === color.hex ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : ""}`}
                                        style={{ backgroundColor: color.hex }}
                                        title={color.name}
                                    />
                                ))}
                                <div className="flex items-center gap-2 relative">
                                    <input
                                        type="color"
                                        value={profileColor || "#ffffff"}
                                        onChange={(e) => setProfileColor(e.target.value)}
                                        className="w-8 h-8 rounded-full cursor-pointer opacity-0 absolute inset-0"
                                    />
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-white to-black border border-white/20 flex items-center justify-center text-[10px] text-black font-bold">+</div>
                                </div>
                            </div>
                            <input type="hidden" name="profileColor" value={profileColor} />
                        </div>

                        {/* 3. Name Gradient (Visual Selectset) */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider">Name Gradient Style</label>
                            <input type="hidden" name="nameGradient" value={nameGradient} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {GRADIENT_PRESETS.map((preset) => (
                                    <div
                                        key={preset.name}
                                        onClick={() => setNameGradient(preset.class)}
                                        className={`p-4 rounded-xl cursor-pointer border-2 transition-all hover:scale-[1.02] ${nameGradient === preset.class ? "border-white bg-zinc-800" : "border-white/5 bg-black/20 hover:border-white/20"}`}
                                    >
                                        <span className={`text-lg font-black bg-gradient-to-r ${preset.class} bg-clip-text text-transparent`}>
                                            {user.name || "PLAYER NAME"}
                                        </span>
                                        <div className="text-[10px] text-zinc-500 uppercase font-bold mt-1">{preset.name}</div>
                                    </div>
                                ))}
                                <div
                                    onClick={() => setNameGradient("")}
                                    className={`p-4 rounded-xl cursor-pointer border-2 transition-all hover:scale-[1.02] ${nameGradient === "" ? "border-white bg-zinc-800" : "border-white/5 bg-black/20 hover:border-white/20"}`}
                                >
                                    <span className="text-lg font-black text-white">
                                        {user.name || "PLAYER NAME"}
                                    </span>
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold mt-1">None</div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Banner & Glow */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider">Custom Banner URL</label>
                                <input
                                    type="url"
                                    name="profileBanner"
                                    value={profileBanner}
                                    onChange={(e) => setProfileBanner(e.target.value)}
                                    placeholder="https://imgur.com/..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    name="profileGlow"
                                    id="glow"
                                    checked={profileGlow}
                                    onChange={(e) => setProfileGlow(e.target.checked)}
                                    className="w-5 h-5 rounded bg-black/40 border-white/10 text-brand-green focus:ring-brand-green"
                                />
                                <label htmlFor="glow" className="text-sm font-bold text-white uppercase cursor-pointer select-none">Enable Avatar Glow Effect</label>
                            </div>
                        </div>
                    </div>
                )
                }

                {
                    msg && (
                        <div className={`p-4 rounded-xl text-center font-bold ${msg.includes("updated") || msg.includes("Activ") || msg.includes("Apply") ? "bg-brand-green/20 text-brand-green" : "bg-red-500/20 text-red-500"}`}>
                            {msg}
                        </div>
                    )
                }

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
                {
                    (mainSide === "SURVIVOR" || mainSide === "BOTH") && (
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
                    )
                }

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
                {
                    ['OWNER', 'ADMIN', 'MODERATOR'].includes(user.role) && (
                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <div className="flex justify-between items-end">
                                <h3 className="text-xl font-black text-brand-green italic uppercase flex items-center gap-2">
                                    🛡️ Staff Bio <span className="text-xs bg-brand-green/20 px-2 py-0.5 rounded text-white not-italic">For FAQ Page</span>
                                </h3>
                                <span className={`text-xs font-bold ${typeof bio === 'string' && bio.length > 300 ? "text-red-500" : "text-zinc-500"}`}>Max 300</span>
                            </div>
                            <p className="text-sm text-zinc-400">
                                This description will appear in the &quot;Meet the Team&quot; section of the FAQ page alongside your avatar.
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
                    )
                }

                <button
                    type="submit"
                    className="w-full bg-brand-green hover:bg-white hover:text-black text-black font-black text-lg py-4 rounded-xl shadow-lg shadow-brand-green/20 hover:scale-[1.02] transition-all"
                >
                    SAVE PROFILE
                </button>
            </form >
        </div >
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
