import Link from "next/link";


export default async function FAQPage() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-brand-green selection:text-black pb-24">

            {/* HERO HERO HERO */}
            <div className="relative py-24 overflow-hidden border-b border-white/5 bg-zinc-900/50">
                <div className="absolute inset-0 bg-[url('/l4d2_bg.jpg')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <div className="absolute top-0 left-6">
                        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest py-4">
                            ← Back to Home
                        </Link>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-6 uppercase">
                        Help & <span className="text-brand-green">FAQ</span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed">
                        Everything you need to know about <span className="text-white font-bold">L4D2 Ranked</span>.
                        From matchmaking rules to player profiles.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-4 gap-12">

                {/* SIDEBAR NAVIGATION (Sticky) */}
                <div className="hidden lg:block col-span-1">
                    <div className="sticky top-24 space-y-2">
                        <NavAnchor href="#general" label="General" />
                        <NavAnchor href="#requirements" label="Requirements" />
                        <NavAnchor href="#how-to-play" label="How to Play" />
                        <NavAnchor href="#mmr" label="MMR System" />
                        <NavAnchor href="#features" label="Profiles & Teams" />
                        <NavAnchor href="#support" label="Support" />
                        <NavAnchor href="#credits" label="Credits" />
                    </div>
                </div>

                {/* CONTENT */}
                <div className="col-span-1 lg:col-span-3 space-y-16">

                    {/* BETA DISCLAIMER */}
                    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <span className="text-4xl">⚠️</span>
                            <div>
                                <h2 className="text-xl font-black text-yellow-400 uppercase mb-2">
                                    Platform in BETA
                                </h2>
                                <p className="text-zinc-300 leading-relaxed mb-3">
                                    L4D2 Ranked is currently under active development. You may experience:
                                </p>
                                <ul className="text-zinc-400 text-sm space-y-1 list-disc list-inside mb-3">
                                    <li>Bugs and unexpected errors</li>
                                    <li>Matchmaking or server connection issues</li>
                                    <li>Stats not updating properly</li>
                                    <li>Features that are incomplete or missing</li>
                                </ul>
                                <p className="text-zinc-500 text-sm">
                                    We appreciate your patience and feedback as we work to improve the platform!
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 1. GENERAL */}
                    <Section id="general" title="What is L4D2 Ranked?">
                        <p>
                            L4D2 Ranked is a competitive matchmaking platform for Left 4 Dead 2 Versus.
                            We provide a structured environment with our own <strong>Matchmaking Rating (MMR)</strong> system
                            to ensure balanced and fair games for everyone, from newcomers to veterans.
                        </p>
                    </Section>

                    {/* 2. REQUIREMENTS */}
                    <Section id="requirements" title="Requirements">
                        <ul className="list-disc list-inside space-y-2 text-zinc-400 marker:text-brand-green">
                            <li>Basic Versus knowledge (Spawns, Attacks, Map paths).</li>
                            <li><strong>NO Family Shared accounts</strong> allowed.</li>
                            <li>Stable internet connection.</li>
                            <li>Working microphone recommended.</li>
                        </ul>
                    </Section>

                    {/* 3. HOW TO PLAY */}
                    <Section id="how-to-play" title="How to Play">
                        <div className="space-y-6">
                            <Step number={1} title="Login & Validation">
                                Login with Steam and validate your account requirements.
                            </Step>
                            <Step number={2} title="Find a Game">
                                Click <strong>&quot;FIND A MATCH&quot;</strong>. Accept the rules and wait for the queue.
                            </Step>
                            <Step number={3} title="Ready Up">
                                When the queue pops, click <strong>READY</strong>. A sound will notify you.
                            </Step>
                            <Step number={4} title="Connect & Play">
                                Connect to the server IP provided. Type <code className="bg-zinc-800 px-2 py-0.5 rounded text-brand-green">!ready</code> in chat to start.
                            </Step>
                        </div>
                    </Section>

                    {/* STEAM LOGIN SECURITY */}
                    <Section id="steam-security" title="Is it safe to login with Steam?">
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-4">
                            <div className="flex items-start gap-3">
                                <span className="text-3xl">🔒</span>
                                <div>
                                    <p className="text-green-400 font-bold mb-2">Yes, it's completely safe!</p>
                                    <p className="text-zinc-300 mb-3">
                                        We use Steam's official authentication system (OpenID). This means:
                                    </p>
                                    <ul className="text-zinc-400 text-sm space-y-2 list-disc list-inside">
                                        <li><strong className="text-white">We don't have access to your Steam password</strong></li>
                                        <li>We only receive public profile information (name, avatar, SteamID)</li>
                                        <li>We cannot make purchases or access your inventory</li>
                                        <li>Your data is only used to create your player profile and track match statistics</li>
                                        <li>You can revoke access anytime from your Steam account settings</li>
                                    </ul>
                                    <p className="text-zinc-500 text-xs mt-3">
                                        Your information is protected and only used to improve your L4D2 Ranked experience.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* 4. MMR SYSTEM */}
                    <Section id="mmr" title="MMR & Ranking">
                        <p className="mb-4">
                            Your MMR (Matchmaking Rating) represents your skill level.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoCard emoji="📈" title="Winning" desc="Increases your MMR." />
                            <InfoCard emoji="📉" title="Losing" desc="Decreases your MMR." />
                            <InfoCard emoji="⚖️" title="Balance" desc="Winning against higher MMR teams grants more points." />
                            <InfoCard emoji="🪵" title="Stability" desc="More games played = More stable MMR rating." />
                        </div>
                        <p className="mt-4 text-sm text-zinc-500">
                            *Rank is revealed after 10 placement matches.
                        </p>
                    </Section>

                    {/* 5. PLATFORM FEATURES (PROFILES & TEAMS) */}
                    <Section id="features" title="Profiles & Teams">
                        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-8 space-y-8">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <span className="text-2xl">👤</span> Player Profile
                                </h3>
                                <p className="text-zinc-400 leading-relaxed">
                                    Your personal hub. Track your <strong>Win Rate, ADR, and Rank History</strong>.
                                    Customize your identity by setting your <strong>Main Role</strong> (Survivor/Infected),
                                    <strong>Weapon Preference</strong>, and <strong>Playstyle</strong> in the profile editor.
                                </p>
                            </div>
                            <div className="h-px bg-white/5"></div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <span className="text-2xl">🛡️</span> Teams System
                                </h3>
                                <p className="text-zinc-400 leading-relaxed">
                                    Create or join a team to compete in the ladder.
                                    Teams have their own <strong>Tag, Logo, and Rating</strong>.
                                    As a Team Leader, you can recruit members and manage your roster directly from the Team Settings panel.
                                </p>
                            </div>
                        </div>
                    </Section>

                    {/* 6. SUPPORT */}
                    <Section id="support" title="Support & Reports">
                        <p className="mb-4">
                            Toxic behavior? Cheaters?
                        </p>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-200">
                            <strong className="block text-red-400 mb-2 uppercase tracking-wide text-sm">How to Report</strong>
                            Record your gameplay (Steam Recording / OBS). Submit a report with the clip evidence.
                            Griefing or Toxicity without evidence cannot be actioned.
                        </div>
                    </Section>

                    {/* 7. CREDITS */}
                    <Section id="credits" title="Credits & Acknowledgements">
                        <div className="space-y-6">
                            <p className="mb-4">
                                L4D2 Ranked is built upon the incredible work of the SourceMod community.
                                Special thanks to:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <a href="https://github.com/SirPlease/L4D2-Competitive-Rework" target="_blank" rel="noopener noreferrer"
                                    className="bg-zinc-900 border border-white/5 p-6 rounded-xl hover:bg-zinc-800 transition-colors group">
                                    <div className="text-2xl mb-2">🏆</div>
                                    <h3 className="font-bold text-white mb-1 group-hover:text-brand-green transition-colors">SirPlease</h3>
                                    <p className="text-sm text-zinc-500">Creator of <strong className="text-zinc-400">ZoneMod</strong>, the competitive standard configuration used on our servers.</p>
                                </a>

                                <a href="https://www.alliedmods.net/" target="_blank" rel="noopener noreferrer"
                                    className="bg-zinc-900 border border-white/5 p-6 rounded-xl hover:bg-zinc-800 transition-colors group">
                                    <div className="text-2xl mb-2">⚙️</div>
                                    <h3 className="font-bold text-white mb-1 group-hover:text-brand-green transition-colors">AlliedModders</h3>
                                    <p className="text-sm text-zinc-500">The foundation of server modification. SourceMod and MetaMod make this platform possible.</p>
                                </a>
                            </div>
                        </div>
                    </Section>

                </div>
            </div>
        </div>
    );
}

function Section({ id, title, children }: { id: string, title: string, children: React.ReactNode }) {
    return (
        <section id={id} className="scroll-mt-32">
            <h2 className="text-3xl font-black italic uppercase text-white mb-6 flex items-center gap-3">
                <span className="h-2 w-8 bg-brand-green rounded-full inline-block"></span>
                {title}
            </h2>
            <div className="text-lg text-zinc-400 leading-relaxed max-w-3xl">
                {children}
            </div>
        </section>
    );
}

function Step({ number, title, children }: { number: number, title: string, children: React.ReactNode }) {
    return (
        <div className="flex gap-4">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center font-black text-2xl text-zinc-600 border border-white/5">
                {number}
            </div>
            <div>
                <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
                <p className="text-zinc-400">{children}</p>
            </div>
        </div>
    );
}

function InfoCard({ emoji, title, desc }: { emoji: string, title: string, desc: string }) {
    return (
        <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 flex items-start gap-3">
            <span className="text-2xl">{emoji}</span>
            <div>
                <div className="font-bold text-white">{title}</div>
                <div className="text-sm text-zinc-500">{desc}</div>
            </div>
        </div>
    );
}

function NavAnchor({ href, label }: { href: string, label: string }) {
    return (
        <Link href={href} className="block px-4 py-2 text-zinc-500 hover:text-brand-green hover:bg-white/5 rounded-lg transition-all font-bold uppercase text-sm tracking-wide">
            {label}
        </Link>
    );
}
