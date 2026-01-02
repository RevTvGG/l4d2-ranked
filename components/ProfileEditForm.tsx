'use client'

import { useState } from "react"
import { updatePreferences } from "@/app/actions/user"
import { useRouter } from "next/navigation"
import ThemeSelector from "@/components/ThemeSelector"
import PremiumCustomization from "@/components/PremiumCustomization"
import PremiumIconSelector from "@/components/PremiumIconSelector"
import ProfileEditTabs from "@/components/ProfileEditTabs"
import { toast } from 'sonner'

export function ProfileEditForm({ user }: { user: any }) {
    const router = useRouter();
    const [msg, setMsg] = useState("");
    const [mainSide, setMainSide] = useState(user?.mainSide || "");
    const [weapon, setWeapon] = useState(user?.survivorWeapon || "");
    const [comm, setComm] = useState(user?.communication || "");
    const [skill, setSkill] = useState(user?.skillLevel || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [playstylePublic, setPlaystylePublic] = useState(user?.playstylePublic ?? true);
    const [savingPrivacy, setSavingPrivacy] = useState(false);

    const isPremium = user?.isPremium || false;

    async function handleSubmit(formData: FormData) {
        setMsg("Saving...");
        const res = await updatePreferences(formData);
        if (res.success) {
            window.location.href = `/profile/${user?.name || ''}`;
        } else {
            setMsg(res.message);
        }
    }

    async function handlePrivacyToggle(value: boolean) {
        setSavingPrivacy(true);
        try {
            const response = await fetch('/api/profile/customize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playstylePublic: value }),
            });
            const data = await response.json();
            if (data.success) {
                setPlaystylePublic(value);
                toast.success('Privacy settings saved!');
                router.refresh();
            } else {
                toast.error(data.error || 'Failed to save');
            }
        } catch (error) {
            toast.error('Network error');
        } finally {
            setSavingPrivacy(false);
        }
    }

    // Tab 1: Appearance Content
    const AppearanceTab = (
        <div className="space-y-8">
            {/* Theme Selector */}
            <ThemeSelector
                currentTheme={user?.profileTheme || 'emerald'}
                isPremium={isPremium}
            />

            {/* Premium Customization (fonts, frames, gradients, glow) */}
            {isPremium && (
                <>
                    <PremiumCustomization user={user} />
                    <div className="bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-black/95 border-2 border-amber-500/40 p-6 rounded-3xl">
                        <PremiumIconSelector currentIcon={user?.premiumIcon || 'star'} />
                    </div>
                </>
            )}
        </div>
    );

    // Tab 2: Playstyle Content
    const PlaystyleTab = (
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
                    <SelectionCard label="Survivor" emoji="🧍" selected={mainSide === "SURVIVOR"} onClick={() => setMainSide("SURVIVOR")} />
                    <SelectionCard label="Infected" emoji="🦠" selected={mainSide === "INFECTED"} onClick={() => setMainSide("INFECTED")} />
                    <SelectionCard label="Both" emoji="☯️" selected={mainSide === "BOTH"} onClick={() => setMainSide("BOTH")} />
                </div>
            </div>

            {/* QUESTION 2 (Conditional) */}
            {(mainSide === "SURVIVOR" || mainSide === "BOTH") && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-xl font-black text-white italic uppercase">2. Preferred Weapon?</h3>
                    <input type="hidden" name="survivorWeapon" value={weapon} />
                    <div className="grid grid-cols-3 gap-4">
                        <SelectionCard label="SMG" emoji="🔫" selected={weapon === "SMG"} onClick={() => setWeapon("SMG")} />
                        <SelectionCard label="Shotgun" emoji="💥" selected={weapon === "SHOTGUN"} onClick={() => setWeapon("SHOTGUN")} />
                        <SelectionCard label="Flexible" emoji="🔁" selected={weapon === "BOTH"} onClick={() => setWeapon("BOTH")} />
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
            {['OWNER', 'ADMIN', 'MODERATOR'].includes(user?.role) && (
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
            )}

            <button
                type="submit"
                className="w-full bg-brand-green hover:bg-white hover:text-black text-black font-black text-lg py-4 rounded-xl shadow-lg shadow-brand-green/20 hover:scale-[1.02] transition-all"
            >
                SAVE PLAYSTYLE
            </button>
        </form>
    );

    // Tab 3: Privacy Content
    const PrivacyTab = (
        <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl shadow-xl space-y-6">
            <div>
                <h3 className="text-xl font-black text-white italic uppercase mb-2">🔒 Privacy Settings</h3>
                <p className="text-zinc-500 text-sm">Control what others can see on your profile</p>
            </div>

            {/* Playstyle Visibility Toggle */}
            <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border-2 border-white/10">
                <div>
                    <h4 className="font-bold text-white">Show Playstyle on Profile</h4>
                    <p className="text-xs text-zinc-400">
                        When enabled, your playstyle tags (side, weapon, communication, skill level) are visible to everyone.
                        <br />
                        <span className="text-brand-green">You (the owner) will always see them.</span>
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => handlePrivacyToggle(!playstylePublic)}
                    disabled={savingPrivacy}
                    className={`w-14 h-8 rounded-full transition-all ${playstylePublic ? 'bg-brand-green' : 'bg-zinc-700'
                        } ${savingPrivacy ? 'opacity-50 cursor-wait' : ''}`}
                >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${playstylePublic ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                </button>
            </div>

            <div className="p-4 bg-zinc-800/50 rounded-xl border border-white/5">
                <p className="text-zinc-400 text-sm">
                    {playstylePublic
                        ? '✅ Your playstyle is currently PUBLIC - everyone can see your tags'
                        : '🔒 Your playstyle is currently HIDDEN - only you can see your tags'
                    }
                </p>
            </div>
        </div>
    );

    const tabs = [
        { id: 'appearance', label: 'Appearance', icon: '🎨', content: AppearanceTab },
        { id: 'playstyle', label: 'Playstyle', icon: '⚙️', content: PlaystyleTab },
        { id: 'privacy', label: 'Privacy', icon: '🔒', content: PrivacyTab },
    ];

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <ProfileEditTabs tabs={tabs} defaultTab="appearance" />

            <div className="flex justify-center border-t border-white/10 pt-6">
                <button
                    type="button"
                    onClick={() => window.location.href = `/profile/${user?.name || ''}`}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition-all border border-white/5"
                >
                    <span>⬅️</span>
                    <span>Back to Profile</span>
                </button>
            </div>
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
