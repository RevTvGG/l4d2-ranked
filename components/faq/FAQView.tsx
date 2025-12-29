"use client"

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FAQ_LABELS, ContentLang } from "./faq-data";
import {
    HelpCircle,
    ShieldAlert,
    Gamepad2,
    Trophy,
    Users,
    Siren,
    HeartHandshake,
    Info,
    ChevronRight,
    Search,
    Globe,
    AlertTriangle,
    Lock,
    Scale,
    Sword,
    Crown,
    Gavel
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQViewProps {
    staff: any[];
}

export function FAQView({ staff }: FAQViewProps) {
    const [lang, setLang] = useState<ContentLang>("en");
    const [activeTab, setActiveTab] = useState("general");

    const t = FAQ_LABELS[lang];

    const MENU_ITEMS = [
        { id: "general", label: t.nav.general, icon: HelpCircle },
        { id: "requirements", label: t.nav.requirements, icon: ShieldAlert },
        { id: "howToPlay", label: t.nav.howToPlay, icon: Gamepad2 },
        { id: "mmr", label: t.nav.mmr, icon: Trophy },
        { id: "profiles", label: t.nav.profiles, icon: Users },
        { id: "teamRules", label: t.nav.teamRules, icon: Scale },
        { id: "bans", label: t.nav.bans, icon: Gavel },
        { id: "premium", label: t.nav.premium, icon: Crown },
        { id: "staff", label: t.nav.staff, icon: HeartHandshake },
        { id: "support", label: t.nav.support, icon: Siren },
        { id: "credits", label: t.nav.credits, icon: Info },
    ];

    const getTabContent = () => {
        switch (activeTab) {
            case "general":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
                            <h2 className="text-3xl font-black italic uppercase text-white mb-6 flex items-center gap-3">
                                {lang === 'en' ? 'What is L4D2 Ranked?' : '¿Qué es L4D2 Ranked?'}
                            </h2>
                            <p className="text-xl text-zinc-400 leading-relaxed">
                                {lang === 'en'
                                    ? "L4D2 Ranked is a competitive matchmaking platform for Left 4 Dead 2 Versus. We provide a structured environment with our own Matchmaking Rating (MMR) system to ensure balanced and fair games for everyone, from newcomers to veterans."
                                    : "L4D2 Ranked es una plataforma competitiva de matchmaking para Left 4 Dead 2 Versus. Ofrecemos un entorno estructurado con nuestro propio sistema de MMR (Ranking) para asegurar partidas equilibradas y justas para todos, desde principiantes hasta veteranos."
                                }
                            </p>
                        </div>
                    </div>
                );

            case "requirements":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
                            <h2 className="text-2xl font-black uppercase text-white mb-6 border-b border-white/5 pb-4">
                                {lang === 'en' ? 'Platform Requirements' : 'Requisitos de la Plataforma'}
                            </h2>
                            <ul className="space-y-4">
                                {[
                                    { en: "Basic Versus knowledge (Spawns, Attacks, Map paths).", es: "Conocimiento básico de Versus (Spawns, Ataques, Mapas)." },
                                    { en: "NO Family Shared accounts allowed.", es: "NO se permiten cuentas compartidas (Family Share)." },
                                    { en: "Stable internet connection.", es: "Conexión a internet estable." },
                                    { en: "Working microphone recommended.", es: "Se recomienda micrófono funcional." },
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-4 p-4 bg-zinc-900 rounded-xl border border-white/5">
                                        <div className="h-6 w-6 rounded-full bg-brand-green/20 text-brand-green flex items-center justify-center shrink-0 mt-0.5">✓</div>
                                        <span className="text-zinc-300 font-medium">{lang === 'en' ? item.en : item.es}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                );

            case "howToPlay":
                return (
                    <div className="animate-in fade-in duration-300">
                        <div className="space-y-4">
                            {[
                                {
                                    step: 1,
                                    title: { en: "Login & Validation", es: "Login y Validación" },
                                    desc: { en: "Login with Steam and validate your account requirements.", es: "Inicia sesión con Steam y valida los requisitos de tu cuenta." }
                                },
                                {
                                    step: 2,
                                    title: { en: "Find a Game", es: "Buscar Partida" },
                                    desc: { en: "Click 'FIND A MATCH'. Accept the rules and wait for the queue.", es: "Haz clic en 'FIND A MATCH'. Acepta las reglas y espera en la cola." }
                                },
                                {
                                    step: 3,
                                    title: { en: "Ready Up", es: "Aceptar Partida" },
                                    desc: { en: "When the queue pops, click READY. A sound will notify you.", es: "Cuando salte la cola, haz clic en READY. Oirás un sonido de notificación." }
                                },
                                {
                                    step: 4,
                                    title: { en: "Connect & Play", es: "Conectar y Jugar" },
                                    desc: { en: "Connect to the server IP. Type !ready in chat to start.", es: "Conecta a la IP del servidor. Escribe !ready en el chat para comenzar." }
                                },
                            ].map((step) => (
                                <div key={step.step} className="flex gap-6 p-6 bg-zinc-900 rounded-2xl border border-white/5 hover:border-brand-green/30 transition-colors group">
                                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-brand-green to-emerald-800 opacity-50 group-hover:opacity-100 transition-opacity">
                                        {step.step}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">{lang === 'en' ? step.title.en : step.title.es}</h3>
                                        <p className="text-zinc-400">{lang === 'en' ? step.desc.en : step.desc.es}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case "teamRules":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid gap-6">
                            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                                <h3 className="font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <span className="text-brand-green">💰</span> {lang === 'en' ? 'Refund Policy' : 'Política de Reembolsos'}
                                </h3>
                                <p className="text-zinc-400 text-sm">
                                    {lang === 'en'
                                        ? "If you delete your team, you will NOT be refunded for the creation cost or any purchased slots. This action is irreversible."
                                        : "Si eliminas tu equipo, NO se te reembolsará el costo de creación ni los espacios comprados. Esta acción es irreversible."
                                    }
                                </p>
                            </div>

                            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                                <h3 className="font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <span className="text-blue-400">👀</span> {lang === 'en' ? 'Impersonation' : 'Suplantación de Identidad'}
                                </h3>
                                <p className="text-zinc-400 text-sm">
                                    {lang === 'en'
                                        ? "Copying another team's name, tag, or identity is strictly prohibited. If you spot a team impersonating yours, report it."
                                        : "Está estrictamente prohibido copiar el nombre, etiqueta o identidad de otro equipo. Si ves un equipo suplantando al tuyo, repórtalo."
                                    }
                                </p>
                            </div>

                            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                                <h3 className="font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <span className="text-orange-400">🔗</span> {lang === 'en' ? 'Invites & Links' : 'Invitaciones y Enlaces'}
                                </h3>
                                <div className="text-zinc-400 text-sm space-y-2">
                                    <p>
                                        {lang === 'en'
                                            ? "As a Team Captain, you are responsible for who you invite."
                                            : "Como Capitán del Equipo, eres responsable de a quién invitas."
                                        }
                                    </p>
                                    <p className="text-xs text-zinc-500 italic">
                                        {lang === 'en'
                                            ? "If you leak your invite link, you must kick unwanted users yourself. Admin is not responsible."
                                            : "Si filtras tu código de invitación, tendrás que eliminar al usuario intruso tú mismo. La administración no se hace responsable."
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-6">
                                <h3 className="font-bold text-red-500 mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" /> {lang === 'en' ? 'Explicit Content' : 'Contenido Explícito'}
                                </h3>
                                <p className="text-red-200/70 text-sm">
                                    {lang === 'en'
                                        ? "Setting a team logo or banner with explicit, offensive, or NSFW content will result in an IMMEDIATE BAN without refund. Team members may also be suspended."
                                        : "Poner una foto con contenido explícito, ofensivo o NSFW resultará en un BANEO INMEDIATO de la página sin reembolsos. Los usuarios dentro del grupo/team serán baneados por una semana."
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case "bans":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
                            <h2 className="text-3xl font-black uppercase text-red-500 mb-6 flex items-center gap-3">
                                <Gavel className="w-8 h-8" />
                                {lang === 'en' ? 'Ban Policy' : 'Política de Baneos'}
                            </h2>

                            <div className="space-y-6">
                                {/* Auto Bans */}
                                <div className="bg-zinc-900 border border-white/5 rounded-xl p-5">
                                    <h3 className="text-lg font-bold text-white uppercase mb-2">
                                        {lang === 'en' ? 'Automatic Bans' : 'Baneos Automáticos'}
                                    </h3>
                                    <p className="text-zinc-400 text-sm">
                                        {lang === 'en'
                                            ? "Automatic bans are irrevocable unless you clarify the situation. Moderators have discretion to review these cases."
                                            : "Los baneos automáticos son irrevocables a menos de que aclares la situación y el moderador tiene criterio."
                                        }
                                    </p>
                                </div>

                                {/* Cheating */}
                                <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-5">
                                    <h3 className="text-lg font-bold text-red-400 uppercase mb-2 flex items-center gap-2">
                                        <Sword className="w-5 h-5" />
                                        {lang === 'en' ? 'Cheating & Hacking' : 'Cheating y Trampas'}
                                    </h3>
                                    <p className="text-red-200/80 text-sm leading-relaxed mb-4">
                                        {lang === 'en'
                                            ? "Bans for cheating are IRREVOCABLE. If you try to convince a staff member to unban you, both you and the staff member may be banned and removed from the platform."
                                            : "Baneos por cheating se consideran IRREVOCABLES. Si tratas de convencer a algún moderador o administrador para que te desbanee automáticamente, la persona del staff pasará a ser baneada y eliminados ambos de la página."
                                        }
                                    </p>
                                    <div className="bg-black/30 p-3 rounded-lg flex items-center gap-3">
                                        <div className="bg-brand-green/20 text-brand-green p-2 rounded-full">
                                            <Trophy className="w-4 h-4" />
                                        </div>
                                        <p className="text-xs text-brand-green/80">
                                            {lang === 'en'
                                                ? "Report a cheater with evidence and receive a special Medal and community recognition!"
                                                : "Si tienes alguna queja o sabes de alguien haciendo trampas, se te recompensará con una MEDALLA en tu perfil y reconocimiento en la comunidad."
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* Toxicity */}
                                <div className="bg-zinc-900 border border-white/5 rounded-xl p-5">
                                    <h3 className="text-lg font-bold text-white uppercase mb-2">
                                        {lang === 'en' ? 'Toxicity & Behavior' : 'Toxicidad y Comportamiento'}
                                    </h3>
                                    <p className="text-zinc-400 text-sm">
                                        {lang === 'en'
                                            ? "If you reoffend in toxic behavior bans, you will be permanently banned. We want a clean community."
                                            : "Baneos por tóxico o comportamiento inapropiado: si reincides en estos baneos terminarás baneado permanentemente. No queremos gente molesta."
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "premium":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-gradient-to-br from-yellow-500/5 to-amber-500/5 border border-yellow-500/20 rounded-3xl p-8">
                            <h2 className="text-3xl font-black uppercase text-yellow-500 mb-6 flex items-center gap-3">
                                <Crown className="w-8 h-8 fill-current" />
                                {lang === 'en' ? 'Premium Refund Policy' : 'Política de Reembolsos – Premium'}
                            </h2>

                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-white uppercase">
                                        {lang === 'en' ? 'Immediate Digital Delivery' : 'Entrega inmediata de contenido digital'}
                                    </h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        {lang === 'en'
                                            ? "By subscribing to Premium, you get immediate access to profile improvements like Shiny Name & Badge, Exclusive themes, and Platform support."
                                            : "Al suscribirte a la membresía Premium, obtienes acceso inmediato a mejoras de perfil como: ✨ Shiny Name & Badge, 🎨 Temas exclusivos, y 📈 Apoyo a la plataforma."
                                        }
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-white uppercase">
                                        {lang === 'en' ? 'Non-refundable' : 'No reembolsable tras activación'}
                                    </h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        {lang === 'en'
                                            ? "Once your account receives the premium features, no refunds are accepted as the digital content is delivered immediately and cannot be 'returned'."
                                            : "Una vez que tu cuenta reciba las mejoras premium, no se aceptan reembolsos, ya que el contenido digital se entrega de forma inmediata y no puede ser “retirado”."
                                        }
                                    </p>
                                </div>

                                <div className="bg-zinc-900 border border-white/5 rounded-xl p-5 space-y-3">
                                    <h3 className="text-md font-bold text-white uppercase flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                                        {lang === 'en' ? 'Exceptional Refunds' : 'Reembolsos excepcionales'}
                                    </h3>
                                    <p className="text-zinc-400 text-sm">
                                        {lang === 'en' ? 'We only consider refunds in cases of:' : 'Solo consideraremos reembolsos en casos de:'}
                                    </p>
                                    <ul className="text-zinc-500 text-sm list-disc list-inside space-y-1">
                                        <li>{lang === 'en' ? 'Accidental duplicate payment' : 'Pago duplicado accidental'}</li>
                                        <li>{lang === 'en' ? 'Technical failure preventing access' : 'Fallo técnico que impida el acceso a las funciones Premium'}</li>
                                        <li>{lang === 'en' ? 'Other exceptional cases evaluated by support' : 'Otros casos excepcionales evaluados por nuestro equipo de soporte'}</li>
                                    </ul>
                                    <div className="text-xs text-zinc-500 bg-black/30 p-3 rounded-lg mt-2">
                                        {lang === 'en'
                                            ? "To request a refund, create a ticket with the format 'bug' and we will analyze the situation."
                                            : "Para realizar un rembolso, crea un ticket con el formato 'bug' y analizaremos la situación."
                                        }
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-600 italic">
                                    {lang === 'en'
                                        ? "The platform reserves the right to modify this policy at any time, notifying users of changes."
                                        : "La plataforma se reserva el derecho de modificar esta política en cualquier momento, notificando los cambios a los usuarios."
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case "staff":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {staff.map((member: any) => (
                            <div key={member.name} className="flex flex-col md:flex-row gap-6 bg-zinc-900 border border-white/5 p-6 rounded-2xl items-center md:items-start text-center md:text-left">
                                <div className="shrink-0 relative">
                                    <div className={cn("w-24 h-24 rounded-full border-2 overflow-hidden",
                                        member.role === 'OWNER' ? 'border-brand-green' : member.role === 'ADMIN' ? 'border-red-500' : 'border-blue-500'
                                    )}>
                                        <Image src={member.image || "/default_avatar.jpg"} alt={member.name} width={96} height={96} className="object-cover h-full w-full" />
                                    </div>
                                    <div className={cn("absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                        member.role === 'OWNER' ? 'bg-brand-green text-black' : member.role === 'ADMIN' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                                    )}>
                                        {member.role}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-black italic uppercase text-white mb-2">{member.name}</h3>
                                    <p className="text-zinc-400 text-sm bg-black/30 p-4 rounded-xl border border-white/5">
                                        {member.staffBio || (lang === 'en' ? "No bio available." : "Sin biografía disponible.")}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )

            case "mmr":
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                        {[
                            { icon: "📈", title: { en: "Winning", es: "Ganar" }, desc: { en: "Increases your MMR.", es: "Aumenta tu MMR." } },
                            { icon: "📉", title: { en: "Losing", es: "Perder" }, desc: { en: "Decreases your MMR.", es: "Disminuye tu MMR." } },
                            { icon: "⚖️", title: { en: "Balance", es: "Balance" }, desc: { en: "Beating high MMR teams grants more points.", es: "Ganar a equipos con mayor MMR da más puntos." } },
                        ].map((item, i) => (
                            <div key={i} className="bg-zinc-900 border border-white/5 p-6 rounded-xl flex items-center gap-4">
                                <div className="text-3xl">{item.icon}</div>
                                <div>
                                    <div className="font-bold text-white">{lang === 'en' ? item.title.en : item.title.es}</div>
                                    <div className="text-sm text-zinc-500">{lang === 'en' ? item.desc.en : item.desc.es}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )

            case "profiles":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-8 space-y-8">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <span className="text-2xl">👤</span> {lang === 'en' ? 'Player Profile' : 'Perfil de Jugador'}
                                </h3>
                                <p className="text-zinc-400 leading-relaxed mb-4">
                                    {lang === 'en'
                                        ? "Your personal hub. Track your Win Rate, ADR, and Rank History. Customize your identity."
                                        : "Tu centro personal. Sigue tu Win Rate, ADR e historial de rango. Personaliza tu identidad."
                                    }
                                </p>
                            </div>
                            <div className="h-px bg-white/5"></div>
                            <div className="bg-red-950/20 border border-red-500/20 p-5 rounded-xl">
                                <h4 className="text-red-400 font-bold uppercase mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    {lang === 'en' ? 'Account Responsibility' : 'Responsabilidad de la Cuenta'}
                                </h4>
                                <ul className="list-disc list-inside text-sm text-red-200/60 space-y-2">
                                    <li>
                                        {lang === 'en'
                                            ? "You are fully responsible for your account and its security."
                                            : "Cada cuenta es responsabilidad de la persona de como la administre."
                                        }
                                    </li>
                                    <li>
                                        {lang === 'en'
                                            ? "Sharing accounts is strictly prohibited."
                                            : "Queda prohibido compartir cuentas y es su responsabilidad cuidar la cuenta."
                                        }
                                    </li>
                                    <li>
                                        {lang === 'en'
                                            ? "Be respectful to the community. Toxic behavior is not tolerated."
                                            : "Comportarse y ser respetuoso con la comunidad."
                                        }
                                    </li>
                                    <li>
                                        {lang === 'en'
                                            ? "Offensive content in profiles or Steam avatars will result in indefinite or temporary bans."
                                            : "No poner cosas ofensivas en su perfil ni en su foto de steam ya que se considera baneo indefinido o baneo temporal."
                                        }
                                    </li>
                                    <li>
                                        <strong>
                                            {lang === 'en'
                                                ? "Do not repeat offenses to avoid automatic bans."
                                                : "No reincidir en baneos automáticos."
                                            }
                                        </strong>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                );

            case "support":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8">
                            <h2 className="text-2xl font-black uppercase text-white mb-6">
                                {lang === 'en' ? 'Support & Reporting' : 'Soporte y Reportes'}
                            </h2>
                            <p className="text-zinc-400 mb-6">
                                {lang === 'en'
                                    ? "Toxic behavior? Cheaters? We are here to help."
                                    : "¿Comportamiento tóxico? ¿Cheaters? Estamos aquí para ayudar."
                                }
                            </p>

                            <div className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-6 flex gap-4 items-start mb-6">
                                <div className="bg-brand-green text-black rounded-lg p-2 shrink-0">
                                    <Siren className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-green uppercase mb-1">
                                        {lang === 'en' ? 'How to Report' : 'Cómo Reportar'}
                                    </h3>
                                    <p className="text-zinc-300 text-sm mb-2">
                                        {lang === 'en'
                                            ? "On every page, look for the report button in the bottom right corner."
                                            : "En cada página, busca el botón de reporte en la esquina inferior derecha."
                                        }
                                    </p>
                                    <p className="text-zinc-500 text-xs italic">
                                        {lang === 'en'
                                            ? "Please provide evidence (video clips) for toxicity or griefing reports."
                                            : "Por favor proporciona evidencia (clips de video) para reportes de toxicidad o griefing."
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case "credits":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8">
                            <h2 className="text-2xl font-black uppercase text-white mb-6">
                                {lang === 'en' ? 'Credits & Acknowledgements' : 'Créditos y Agradecimientos'}
                            </h2>
                            <p className="mb-6 text-zinc-400">
                                {lang === 'en'
                                    ? "Special thanks to the following communities and developers for their libraries and support."
                                    : "Gracias a Sir Please y a AlliedModders por todas las bibliotecas y el apoyo."
                                }
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <a href="https://github.com/SirPlease/L4D2-Competitive-Rework" target="_blank" rel="noopener noreferrer"
                                    className="block relative h-48 rounded-xl overflow-hidden border border-white/10 group hover:border-brand-green/50 transition-all">
                                    <Image src="/credits/sirplease.png" alt="SirPlease ZoneMod" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                        <h3 className="text-2xl font-black text-white uppercase tracking-widest border-b-2 border-brand-green pb-1">SirPlease</h3>
                                    </div>
                                </a>

                                <a href="https://www.alliedmods.net/" target="_blank" rel="noopener noreferrer"
                                    className="block relative h-48 rounded-xl overflow-hidden border border-white/10 group hover:border-blue-500/50 transition-all">
                                    <Image src="/credits/alliedmodders.png" alt="AlliedModders" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                        <h3 className="text-2xl font-black text-white uppercase tracking-widest border-b-2 border-blue-500 pb-1">AlliedModders</h3>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="p-8 text-center text-zinc-500 italic animate-in fade-in duration-300">
                        {lang === 'en' ? 'Select a category.' : 'Selecciona una categoría.'}
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-brand-green selection:text-black">
            {/* Header */}
            <div className="relative h-[25vh] bg-zinc-900 overflow-hidden border-b border-white/10 flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('/l4d2_bg.jpg')] bg-cover bg-center opacity-20 blur-sm mix-blend-overlay"></div>
                <div className="relative z-10 text-center max-w-2xl px-4">
                    <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-6 border border-white/10 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md">
                        {t.nav.back}
                    </Link>
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase mb-2">
                        {t.hero.title}
                    </h1>
                    <p className="text-xl text-zinc-400 font-medium">
                        {t.hero.subtitle}
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Sidebar */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Language Toggle */}
                        <div className="bg-zinc-900/50 p-1.5 rounded-xl border border-white/5 flex relative">
                            <button
                                onClick={() => setLang('en')}
                                className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all relative z-10", lang === 'en' ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300")}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setLang('es')}
                                className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all relative z-10", lang === 'es' ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300")}
                            >
                                Español
                            </button>
                        </div>

                        {/* Validated Beta Warning */}
                        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-5">
                            <h4 className="flex items-center gap-2 text-yellow-500 font-black uppercase text-sm mb-2">
                                <AlertTriangle className="w-4 h-4" /> BETA
                            </h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                {t.beta.desc}
                            </p>
                        </div>

                        {/* Navigation */}
                        <div className="space-y-1">
                            {MENU_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={cn(
                                            "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-left group",
                                            isActive
                                                ? "bg-brand-green text-black font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                                                : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                                        )}
                                    >
                                        <Icon className={cn("w-5 h-5", isActive ? "text-black" : "text-zinc-600 group-hover:text-brand-green")} />
                                        <span className="flex-1">{item.label}</span>
                                        {isActive && <ChevronRight className="w-4 h-4" />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-9">
                        <div className="min-h-[600px]">
                            {getTabContent()}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
