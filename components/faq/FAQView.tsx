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
    Gavel,
    Construction
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
        { id: "beta", label: t.nav.beta, icon: Construction },
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
                            <div className="space-y-4 text-zinc-400 leading-relaxed text-lg">
                                <p>
                                    {lang === 'en'
                                        ? "L4D2 Ranked is a specialized competitive platform designed to modernize the Left 4 Dead 2 Versus experience. Born from the need for a structured environment, we offer high-performance servers, a robust anti-cheat system, and a fair ranking system."
                                        : "L4D2 Ranked es una plataforma competitiva especializada diseñada para modernizar la experiencia de Left 4 Dead 2 Versus. Nacida de la necesidad de un entorno estructurado, ofrecemos servidores de alto rendimiento, un sistema anti-cheat robusto y un sistema de clasificación justo."
                                    }
                                </p>
                                <p>
                                    {lang === 'en'
                                        ? "Unlike public Matchmaking, our platform uses the 'ZoneMod' configuration, the gold standard for competitive play. This ensures that game balance is maintained, randomness is minimized, and skill is the primary factor in victory."
                                        : "A diferencia del Matchmaking público, nuestra plataforma utiliza la configuración 'ZoneMod', el estándar de oro para el juego competitivo. Esto asegura que se mantenga el equilibrio del juego, se minimice la aleatoriedad y que la habilidad sea el factor principal para la victoria."
                                    }
                                </p>
                                <p>
                                    {lang === 'en'
                                        ? "Our mission is to build the definitive community for players who want to take their game to the next level, facilitating tournament organization, team ladders, and individual progression."
                                        : "Nuestra misión es construir la comunidad definitiva para jugadores que buscan llevar su juego al siguiente nivel, facilitando la organización de torneos, ladders de equipos y la progresión individual."
                                    }
                                </p>
                            </div>
                        </div>

                        {/* STEAM SECURITY & INFRASTRUCTURE */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
                            <h2 className="text-2xl font-black uppercase text-white mb-6 flex items-center gap-3">
                                <span className="text-3xl text-brand-green">🛡️</span>
                                {lang === 'en' ? 'Steam Login Security & Infrastructure' : 'Seguridad con Steam e Infraestructura'}
                            </h2>
                            <div className="space-y-6 text-zinc-400 leading-relaxed text-sm md:text-base">
                                <div className="bg-black/20 p-6 rounded-xl border-l-4 border-brand-green">
                                    <h3 className="font-bold text-white uppercase mb-2">
                                        {lang === 'en' ? 'Why is it Safe?' : '¿Por qué es seguro?'}
                                    </h3>
                                    <p>
                                        {lang === 'en'
                                            ? "We use the official Steam OpenID protocol for authentication. This means we NEVER see, access, or store your Steam password or login credentials. When you sign in, you are redirected securely to Valve's official site, and they simply tell us: 'Yes, this user is verified'. This mechanism ensures your account remains 100% secure under Valve's protection."
                                            : "Utilizamos el protocolo oficial Steam OpenID para la autenticación. Esto significa que NUNCA vemos, accedemos ni almacenamos tu contraseña de Steam o credenciales de inicio de sesión. Cuando inicias sesión, eres redirigido de forma segura al sitio oficial de Valve, y ellos simplemente nos dicen: 'Sí, este usuario está verificado'. Este mecanismo asegura que tu cuenta permanezca 100% segura bajo la protección de Valve."
                                        }
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-white uppercase text-lg border-b border-white/5 pb-2">
                                        {lang === 'en' ? 'Service Dependency & Maintenance' : 'Dependencia del Servicio y Mantenimiento'}
                                    </h3>
                                    <p>
                                        {lang === 'en'
                                            ? "It is important to understand that L4D2 Ranked relies completely on the Steam API to function. Our verification, login, and profile data systems fetch information directly from Steam's servers."
                                            : "Es importante entender que L4D2 Ranked depende completamente de la API de Steam para funcionar. Nuestros sistemas de verificación, inicio de sesión y datos de perfil obtienen información directamente de los servidores de Steam."
                                        }
                                    </p>

                                    <ul className="grid gap-4 md:grid-cols-2">
                                        <li className="bg-zinc-950 p-4 rounded-xl border border-white/5">
                                            <strong className="block text-blue-400 uppercase mb-1 text-xs tracking-wider">
                                                {lang === 'en' ? 'Routine Maintenance' : 'Mantenimiento de Rutina'}
                                            </strong>
                                            <p className="text-xs text-zinc-500">
                                                {lang === 'en'
                                                    ? "Every Tuesday (approx. 4:00 PM PST), Steam performs scheduled maintenance. During this window, our services may be suspended or unreachable. This is normal behavior."
                                                    : "Cada martes (aprox. 4:00 PM PST), Steam realiza tareas de mantenimiento programadas. Durante esta ventana, es posible que nuestros servicios estén suspendidos o no disponibles. Esto es un comportamiento normal."
                                                }
                                            </p>
                                        </li>
                                        <li className="bg-zinc-950 p-4 rounded-xl border border-white/5">
                                            <strong className="block text-red-400 uppercase mb-1 text-xs tracking-wider">
                                                {lang === 'en' ? 'API Outages' : 'Caídas de la API'}
                                            </strong>
                                            <p className="text-xs text-zinc-500">
                                                {lang === 'en'
                                                    ? "If Steam goes down, our platform goes down. We do this to protect user integrity; without Steam verification, we cannot guarantee who is connecting to our servers."
                                                    : "Si Steam se cae, nuestra plataforma se cae. Hacemos esto para proteger la integridad del usuario; sin la verificación de Steam, no podemos garantizar quién se está conectando a nuestros servidores."
                                                }
                                            </p>
                                        </li>
                                    </ul>

                                    <div className="bg-blue-500/10 p-4 rounded-xl text-xs text-blue-200/80 italic text-center">
                                        {lang === 'en'
                                            ? "Note: We are actively exploring independent login systems for the future, but for now, the Steam API is the bedrock of our security architecture."
                                            : "Nota: Estamos explorando activamente sistemas de inicio de sesión independientes para el futuro, pero por ahora, la API de Steam es la base de nuestra arquitectura de seguridad."
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "requirements":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
                            <h2 className="text-2xl font-black uppercase text-white mb-6 border-b border-white/5 pb-4">
                                {lang === 'en' ? 'Core Requirements' : 'Requisitos Fundamentales'}
                            </h2>
                            <div className="space-y-6">
                                <p className="text-zinc-400">
                                    {lang === 'en'
                                        ? "To ensure the integrity of our matches and the security of our community, all players must meet strict criteria before competing."
                                        : "Para garantizar la integridad de nuestras partidas y la seguridad de nuestra comunidad, todos los jugadores deben cumplir con criterios estrictos antes de competir."
                                    }
                                </p>

                                <ul className="space-y-4">
                                    {[
                                        {
                                            title: { en: "Game Knowledge", es: "Conocimiento del Juego" },
                                            desc: { en: "You should understand competitive mechanics: Tank spawns, Quad-caps, Map routing, and infected synergy. This is not for absolute beginners.", es: "Debes entender mecánicas competitivas: Spawns de Tank, Quad-caps, Rutas de mapas y sinergia de infectados. Esta plataforma no es para principiantes absolutos." }
                                        },
                                        {
                                            title: { en: "Account Security", es: "Seguridad de la Cuenta" },
                                            desc: { en: "Family Shared accounts are strictly PROHIBITED to prevent ban evasion. Your Steam profile must be set to Public to verify hours and achievements.", es: "Las cuentas compartidas (Family Share) están estrictamente PROHIBIDAS para evitar la evasión de baneos. Tu perfil de Steam debe ser Público para verificar horas y logros." }
                                        },
                                        {
                                            title: { en: "Technical Setup", es: "Configuración Técnica" },
                                            desc: { en: "A stable internet connection (Ethernet recommended) and a working microphone are essential for team communication.", es: "Una conexión a internet estable (se recomienda Ethernet) y un micrófono funcional son esenciales para la comunicación en equipo." }
                                        },
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-4 p-5 bg-zinc-900 rounded-xl border border-white/5">
                                            <div className="h-6 w-6 rounded-full bg-brand-green/20 text-brand-green flex items-center justify-center shrink-0 mt-0.5">✓</div>
                                            <div>
                                                <strong className="block text-white mb-1 font-bold uppercase">{lang === 'en' ? item.title.en : item.title.es}</strong>
                                                <span className="text-zinc-400 text-sm leading-relaxed">{lang === 'en' ? item.desc.en : item.desc.es}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                );

            case "howToPlay":
                return (
                    <div className="animate-in fade-in duration-300">
                        <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 mb-6">
                            <p className="text-zinc-400 mb-6 leading-relaxed">
                                {lang === 'en'
                                    ? "Starting your competitive journey is simple. Our automatch system handles all the server configuration for you."
                                    : "Comenzar tu viaje competitivo es simple. Nuestro sistema de automatch maneja toda la configuración del servidor por ti."
                                }
                            </p>
                            <div className="space-y-4">
                                {[
                                    {
                                        step: 1,
                                        title: { en: "Login & Validation", es: "Login y Validación" },
                                        desc: { en: "Sign in securely through Steam. Our system scans your account for VAC bans and playtime requirements automatically.", es: "Inicia sesión de forma segura a través de Steam. Nuestro sistema escanea tu cuenta en busca de baneos VAC y requisitos de tiempo de juego automáticamente." }
                                    },
                                    {
                                        step: 2,
                                        title: { en: "Queue Up", es: "Buscar Partida" },
                                        desc: { en: "Click 'FIND A MATCH'. You can queue solo or with a party. The matchmaker will try to balance teams based on MMR.", es: "Haz clic en 'FIND A MATCH'. Puedes buscar solo o en grupo. El emparejador intentará equilibrar los equipos basándose en el MMR." }
                                    },
                                    {
                                        step: 3,
                                        title: { en: "Ready Check", es: "Confirmación" },
                                        desc: { en: "When a match is found, a 'READY' prompt will appear with a sound alert. You must accept within 30 seconds.", es: "Cuando se encuentra una partida, aparecerá un aviso de 'READY' con una alerta de sonido. Debes aceptar dentro de los 30 segundos." }
                                    },
                                    {
                                        step: 4,
                                        title: { en: "Connect & Dominate", es: "Conectar y Dominar" },
                                        desc: { en: "Upon accepting, you'll see the Server IP. Connect via console. Once inside, type !ready to signal you are prepared.", es: "Al aceptar, verás la IP del servidor. Conéctate vía consola. Una vez dentro, escribe !ready para señalar que estás preparado." }
                                    },
                                ].map((step) => (
                                    <div key={step.step} className="flex gap-6 p-6 bg-zinc-950 rounded-2xl border border-white/5 hover:border-brand-green/30 transition-colors group">
                                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-brand-green to-emerald-800 opacity-50 group-hover:opacity-100 transition-opacity">
                                            {step.step}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-2">{lang === 'en' ? step.title.en : step.title.es}</h3>
                                            <p className="text-zinc-400 leading-relaxed text-sm">{lang === 'en' ? step.desc.en : step.desc.es}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case "mmr":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8">
                            <h2 className="text-2xl font-black uppercase text-white mb-4">
                                {lang === 'en' ? 'The Logic Behind Ranking' : 'La Lógica del Ranking'}
                            </h2>
                            <p className="text-zinc-400 mb-8 leading-relaxed">
                                {lang === 'en'
                                    ? "We use a modified Elo rating system tailored for team-based gameplay. Your rating is a numerical representation of your probability to win against other players."
                                    : "Utilizamos un sistema de puntuación Elo modificado y adaptado para el juego en equipo. Tu clasificación es una representación numérica de tu probabilidad de ganar contra otros jugadores."
                                }
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { icon: "📈", title: { en: "winning", es: "Ganar" }, desc: { en: "Increases your MMR. The amount depends on the enemy team's rating. Beating a stronger team yields more points.", es: "Aumenta tu MMR. La cantidad depende del rating del equipo enemigo. Ganar a un equipo más fuerte otorga más puntos." } },
                                    { icon: "📉", title: { en: "Losing", es: "Perder" }, desc: { en: "Decreases your MMR. Losing to a weaker team penalizes you more heavily than losing to a strong one.", es: "Disminuye tu MMR. Perder contra un equipo más débil te penaliza más fuertemente que perder contra uno fuerte." } },
                                    { icon: "⚖️", title: { en: "Uncertainty", es: "Incertidumbre" }, desc: { en: "New accounts have high 'rating deviation', meaning their MMR swings wildly until their skill level is effectively calibrated.", es: "Las cuentas nuevas tienen una alta 'desviación', lo que significa que su MMR oscila violentamente hasta que su nivel de habilidad está calibrado." } },
                                    { icon: "🏅", title: { en: "Ranks", es: "Rangos" }, desc: { en: "Ratings are grouped into Tiers (Silver, Gold, Diamond, etc). You must complete 10 Placement Matches to reveal your initial rank.", es: "Los ratings se agrupan en Tiers (Plata, Oro, Diamante, etc). Debes completar 10 Partidas de Colocación para revelar tu rango inicial." } },
                                ].map((item, i) => (
                                    <div key={i} className="bg-zinc-950 border border-white/5 p-6 rounded-xl flex gap-4">
                                        <div className="text-3xl shrink-0">{item.icon}</div>
                                        <div>
                                            <div className="font-bold text-white uppercase text-sm mb-1">{lang === 'en' ? item.title.en : item.title.es}</div>
                                            <div className="text-sm text-zinc-500 leading-relaxed">{lang === 'en' ? item.desc.en : item.desc.es}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case "beta":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-3xl p-8">
                            <h2 className="text-3xl font-black uppercase text-yellow-500 mb-6 flex items-center gap-3">
                                <Construction className="w-8 h-8 flex-shrink-0" />
                                {lang === 'en' ? 'Beta Status & Limitations' : 'Estado Beta y Limitaciones'}
                            </h2>

                            <div className="space-y-6">
                                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
                                    <p className="text-lg text-white mb-4 leading-relaxed">
                                        {lang === 'en'
                                            ? "We are currently in a restricted BETA phase. This means the platform is under active construction and testing."
                                            : "Actualmente nos encontramos en una fase BETA restringida. Esto significa que la plataforma está bajo construcción y pruebas activas."
                                        }
                                    </p>
                                    <ul className="space-y-3">
                                        {[
                                            { en: "The website may occasionally go offline or fail.", es: "La página web puede fallar o estar fuera de línea ocasionalmente." },
                                            { en: "Queues may be slow because we have a limited number of servers available.", es: "Las colas pueden ser lentas porque tenemos un número limitado de servidores disponibles." },
                                            { en: "Matchmaking logic might be adjusted live.", es: "La lógica del matchmaking puede ser ajustada en vivo." }
                                        ].map((item, i) => (
                                            <li key={i} className="flex gap-3 text-zinc-400">
                                                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                                                <span>{lang === 'en' ? item.en : item.es}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-red-950/20 border border-red-500/20 p-6 rounded-2xl">
                                    <h3 className="text-xl font-bold text-red-400 uppercase mb-3 flex items-center gap-2">
                                        <Lock className="w-5 h-5" />
                                        {lang === 'en' ? 'Registrations Closed' : 'Registros Cerrados'}
                                    </h3>
                                    <p className="text-red-200/80 leading-relaxed">
                                        {lang === 'en'
                                            ? "To control server load, account creation is currently RESTRICTED. We will gradually open more spots as we scale our infrastructure."
                                            : "Para controlar la carga de los servidores, la creación de cuentas está actualmente CERRADA y RESTRINGIDA. Iremos abriendo más cupos gradualmente a medida que escalemos nuestra infraestructura."
                                        }
                                    </p>
                                </div>

                                <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl text-center">
                                    <h3 className="text-xl font-bold text-blue-400 uppercase mb-3 text-shadow-glow">
                                        {lang === 'en' ? 'Grand Launch & Reset' : 'Gran Lanzamiento y Reinicio'}
                                    </h3>
                                    <p className="text-blue-100/80 leading-relaxed mb-4">
                                        {lang === 'en'
                                            ? "When we launch the final version (V1.0), all Matchmaking Ratings (MMR) and Ranks will be RESET. This ensures a fresh, fair start for everyone."
                                            : "Cuando lancemos la versión final (V1.0), todo el MMR y los Rangos serán REINICIADOS. Esto asegura un comienzo fresco y justo para todos."
                                        }
                                    </p>
                                    <div className="inline-block bg-blue-500 text-black font-bold px-4 py-2 rounded-lg text-sm uppercase">
                                        {lang === 'en' ? 'Enjoy the Beta features!' : '¡Disfruten las funciones Beta!'}
                                    </div>
                                </div>

                                {/* Unverified Account Warning */}
                                <div className="bg-red-950/30 border-2 border-red-500/50 p-6 rounded-2xl">
                                    <h3 className="text-xl font-bold text-red-500 uppercase mb-3 flex items-center gap-2">
                                        🗑️ {lang === 'en' ? 'Account Deletion Warning' : 'Advertencia de Eliminación de Cuentas'}
                                    </h3>
                                    <p className="text-red-200/90 leading-relaxed mb-4">
                                        {lang === 'en'
                                            ? "If you register without a valid invite code, your account will remain in an UNVERIFIED state. Unverified accounts have NO access to the platform features and WILL BE PERIODICALLY DELETED by the administration team without prior notice."
                                            : "Si te registras sin un código de invitación válido, tu cuenta permanecerá en estado NO VERIFICADO. Las cuentas no verificadas NO tienen acceso a las funciones de la plataforma y SERÁN ELIMINADAS PERIÓDICAMENTE por el equipo de administración sin previo aviso."
                                        }
                                    </p>
                                    <p className="text-red-300/80 text-sm bg-red-500/10 p-3 rounded-lg">
                                        {lang === 'en' ? (
                                            <>
                                                ⚠️ To get an invite code, <Link href="/beta/request" className="text-brand-green hover:underline font-bold">fill out the request form</Link> or contact an existing member.
                                            </>
                                        ) : (
                                            <>
                                                ⚠️ Para obtener un código de invitación, <Link href="/beta/request" className="text-brand-green hover:underline font-bold">completa el formulario de solicitud</Link> o contacta a un miembro existente.
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "teamRules":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid gap-6">
                            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-8">
                                <h3 className="font-bold text-white mb-3 uppercase tracking-wide flex items-center gap-3 text-xl">
                                    <span className="text-brand-green text-3xl">💰</span> {lang === 'en' ? 'Refund Policy' : 'Política de Reembolsos'}
                                </h3>
                                <p className="text-zinc-400">
                                    {lang === 'en'
                                        ? "Team creation involves database resource allocation. Therefore, if you voluntarily delete your team, you will NOT be refunded for the creation cost or any purchased member slots. This action is irreversible—once deleted, the data is gone forever."
                                        : "La creación de equipos implica la asignación de recursos de base de datos. Por lo tanto, si eliminas voluntariamente tu equipo, NO se te reembolsará el costo de creación ni los espacios de miembros comprados. Esta acción es irreversible: una vez borrados, los datos desaparecen para siempre."
                                    }
                                </p>
                            </div>

                            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-8">
                                <h3 className="font-bold text-white mb-3 uppercase tracking-wide flex items-center gap-3 text-xl">
                                    <span className="text-blue-400 text-3xl">👀</span> {lang === 'en' ? 'Impersonation' : 'Suplantación de Identidad'}
                                </h3>
                                <p className="text-zinc-400">
                                    {lang === 'en'
                                        ? "Identity is crucial in a ladder system. Copying another team's name, tag, or visual identity is strictly prohibited to prevent confusion. If you spot a team impersonating yours, please report it immediately via the support channels."
                                        : "La identidad es crucial en un sistema de ladder. Copiar el nombre, la etiqueta o la identidad visual de otro equipo está estrictamente prohibido para evitar confusiones. Si ves un equipo suplantando al tuyo, repórtalo inmediatamente a través de los canales de soporte."
                                    }
                                </p>
                            </div>

                            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-8">
                                <h3 className="font-bold text-white mb-3 uppercase tracking-wide flex items-center gap-3 text-xl">
                                    <span className="text-orange-400 text-3xl">🔗</span> {lang === 'en' ? 'Invites & Responsibility' : 'Invitaciones y Responsabilidad'}
                                </h3>
                                <div className="text-zinc-400 space-y-4">
                                    <p>
                                        {lang === 'en'
                                            ? "As a Team Captain, you hold full responsibility for the roster management. This includes vetting players before inviting them."
                                            : "Como Capitán del Equipo, tienes total responsabilidad sobre la gestión de la plantilla. Esto incluye investigar a los jugadores antes de invitarlos."
                                        }
                                    </p>
                                    <p className="text-sm text-zinc-500 bg-black/20 p-4 rounded-lg italic border-l-2 border-orange-500">
                                        {lang === 'en'
                                            ? "Security Notice: If you accidentally leak your invite link/code, unwanted users might join. You must kick them manually. Administration is not responsible for unauthorized joins via leaked links."
                                            : "Aviso de Seguridad: Si filtras accidentalmente tu enlace/código de invitación, pueden unirse usuarios no deseados. Debes expulsarlos manualmente. La administración no se hace responsable de las uniones no autorizadas a través de enlaces filtrados."
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-8">
                                <h3 className="font-bold text-red-500 mb-3 uppercase tracking-wide flex items-center gap-3 text-xl">
                                    <AlertTriangle className="w-8 h-8" /> {lang === 'en' ? 'Explicit Content' : 'Contenido Explícito'}
                                </h3>
                                <div className="text-red-200/80 space-y-4">
                                    <p>
                                        {lang === 'en'
                                            ? "We maintain a zero-tolerance policy regarding offensive material. Setting a team logo or banner with explicit, offensive, hate-speech, or NSFW content will result in an IMMEDIATE BAN from the platform without refund."
                                            : "Mantenemos una política de tolerancia cero con respecto al material ofensivo. Poner un logo o banner de equipo con contenido explícito, ofensivo, discurso de odio o NSFW resultará en un BANEO INMEDIATO de la plataforma sin reembolso."
                                        }
                                    </p>
                                    <p className="font-bold text-red-400">
                                        {lang === 'en'
                                            ? "Collective Punishment Warning: All members of a team found violating this rule may also be subject to temporary bans (up to 7 days). Choose your teammates carefully."
                                            : "Advertencia de Castigo Colectivo: Todos los miembros de un equipo que viole esta regla también pueden estar sujetos a baneos temporales (hasta 7 días). Elige a tus compañeros cuidadosamente."
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case "bans":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
                            <h2 className="text-3xl font-black uppercase text-red-500 mb-8 flex items-center gap-3">
                                <Gavel className="w-8 h-8" />
                                {lang === 'en' ? 'Ban Policy & Enforcement' : 'Política y Ejecución de Baneos'}
                            </h2>

                            <div className="space-y-8">
                                {/* Auto Bans */}
                                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 shadow-xl">
                                    <h3 className="text-xl font-bold text-white uppercase mb-3 flex items-center gap-2">
                                        <span className="text-2xl">🤖</span>
                                        {lang === 'en' ? 'Automatic Systems' : 'Sistemas Automáticos'}
                                    </h3>
                                    <p className="text-zinc-400 leading-relaxed">
                                        {lang === 'en'
                                            ? "Our anti-cheat and behavior systems operate automatically. Bans issued by the system are generally considered correct and irrevocable. However, moderators have the discretion to review specific cases if clear evidence of a false positive is provided."
                                            : "Nuestros sistemas de anti-cheat y comportamiento operan automáticamente. Los baneos emitidos por el sistema se consideran generalmente correctos e irrevocables. Sin embargo, los moderadores tienen la discreción de revisar casos específicos si se proporciona evidencia clara de un falso positivo."
                                        }
                                    </p>
                                </div>

                                {/* Cheating */}
                                <div className="bg-gradient-to-br from-red-950/30 to-black border border-red-500/30 rounded-2xl p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Sword className="w-32 h-32" />
                                    </div>
                                    <h3 className="text-xl font-bold text-red-400 uppercase mb-3 flex items-center gap-2 relative z-10">
                                        <Sword className="w-6 h-6" />
                                        {lang === 'en' ? 'Cheating & Manipulation' : 'Trampas y Manipulación'}
                                    </h3>
                                    <div className="text-red-200/80 leading-relaxed mb-6 space-y-4 relative z-10">
                                        <p>
                                            {lang === 'en'
                                                ? "Bans for cheating are ABSOLUTE and IRREVOCABLE. This is non-negotiable."
                                                : "Los baneos por hacer trampas (cheating) son ABSOLUTOS e IRREVOCABLES. Esto no es negociable."
                                            }
                                        </p>
                                        <p className="bg-red-500/10 p-4 rounded-lg border-l-4 border-red-500">
                                            <strong>{lang === 'en' ? "Corruption Policy: " : "Política de Corrupción: "}</strong>
                                            {lang === 'en'
                                                ? "Attempting to bribe, coerce, or convince a staff member to bypass a ban will result in the immediate termination of the staff member involved and a permanent, hardware-ID ban for both parties."
                                                : "Intentar sobornar, coaccionar o convencer a un miembro del staff para eludir un baneo resultará en la terminación inmediata del miembro del staff involucrado y un baneo permanente de hardware-ID para ambas partes."
                                            }
                                        </p>
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-xl flex items-center gap-4 relative z-10 border border-white/5">
                                        <div className="bg-brand-green/20 text-brand-green p-3 rounded-full shrink-0">
                                            <Trophy className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-brand-green uppercase text-sm mb-1">{lang === 'en' ? "Bounty Program" : "Programa de Recompensas"}</h4>
                                            <p className="text-sm text-zinc-400">
                                                {lang === 'en'
                                                    ? "Community integrity is everyone's job. Report a cheater with verifiable evidence (demo/video) and receive a distinctive profile Medal and public recognition."
                                                    : "La integridad de la comunidad es trabajo de todos. Reporta a un cheater con evidencia verificable (demo/video) y recibe una MEDALLA de perfil distintiva y reconocimiento público."
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Toxicity */}
                                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-xl font-bold text-white uppercase mb-3 flex items-center gap-2">
                                        <span className="text-2xl">🤬</span> {lang === 'en' ? 'Toxicity & Harassment' : 'Toxicidad y Acoso'}
                                    </h3>
                                    <p className="text-zinc-400 leading-relaxed mb-4">
                                        {lang === 'en'
                                            ? "We strive for a competitive but respectful environment. While banter is part of the game, harassment, hate speech, and griefing are not."
                                            : "Nos esforzamos por un entorno competitivo pero respetuoso. Si bien las bromas son parte del juego, el acoso, el discurso de odio y el griefing no lo son."
                                        }
                                    </p>
                                    <div className="flex gap-4 items-center bg-zinc-950 p-4 rounded-lg">
                                        <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />
                                        <p className="text-orange-400/90 text-sm font-medium">
                                            {lang === 'en'
                                                ? "Strike System: Repeated offenses for toxicity lead to escalating ban durations, culminating in a PERMANENT ban. We do not tolerate chronic toxicity."
                                                : "Sistema de Strikes: Las ofensas repetidas por toxicidad conducen a una escalada en la duración de los baneos, culminando en un baneo PERMANENTE. No toleramos la toxicidad crónica."
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "premium":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-gradient-to-br from-yellow-500/5 to-amber-500/5 border border-yellow-500/20 rounded-3xl p-8">
                            <h2 className="text-3xl font-black uppercase text-yellow-500 mb-8 flex items-center gap-3">
                                <Crown className="w-8 h-8 fill-current" />
                                {lang === 'en' ? 'Premium Terms & Refund Policy' : 'Términos Premium y Política de Reembolsos'}
                            </h2>

                            <div className="space-y-10">
                                <div className="space-y-3">
                                    <h3 className="text-xl font-bold text-white uppercase flex items-center gap-2">
                                        <span className="text-yellow-500">⚡</span>
                                        {lang === 'en' ? 'Immediate Digital Delivery' : 'Entrega Inmediata de Contenido Digital'}
                                    </h3>
                                    <p className="text-zinc-400 text-base leading-relaxed">
                                        {lang === 'en'
                                            ? "By subscribing to Premium, you acknowledge that you receive immediate access to intangible digital goods. These include profile enhancements (Shiny Name, Badges), exclusive themes, and prioritization features."
                                            : "Al suscribirte a Premium, reconoces que recibes acceso inmediato a bienes digitales intangibles. Estos incluyen mejoras de perfil (Nombre Brillante, Insignias), temas exclusivos y características de priorización."
                                        }
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-xl font-bold text-white uppercase flex items-center gap-2">
                                        <span className="text-red-400">⛔</span>
                                        {lang === 'en' ? 'Non-Refundable Policy' : 'Política de No Reembolso'}
                                    </h3>
                                    <p className="text-zinc-400 text-base leading-relaxed">
                                        {lang === 'en'
                                            ? "Because the service is rendered instantly upon payment, we generally do NOT offer refunds. The 'consumption' of the digital privilege begins the moment your account status is updated."
                                            : "Debido a que el servicio se presta instantáneamente tras el pago, generalmente NO ofrecemos reembolsos. El 'consumo' del privilegio digital comienza en el momento en que se actualiza el estado de tu cuenta."
                                        }
                                    </p>
                                </div>

                                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 space-y-4">
                                    <h3 className="text-lg font-bold text-white uppercase flex items-center gap-2 border-b border-white/5 pb-2">
                                        <AlertTriangle className="w-5 h-5 text-orange-400" />
                                        {lang === 'en' ? 'Exceptions & Support' : 'Excepciones y Soporte'}
                                    </h3>
                                    <p className="text-zinc-400 text-sm">
                                        {lang === 'en' ? 'We understand that errors happen. We review refund requests manually for specific scenarios:' : 'Entendemos que los errores ocurren. Revisamos las solicitudes de reembolso manualmente para escenarios específicos:'}
                                    </p>
                                    <ul className="grid grid-cols-1 gap-3">
                                        {[
                                            { en: "Accidental duplicate charges (Double billing).", es: "Cargos duplicados accidentales (doble facturación)." },
                                            { en: "Critical technical failures preventing feature usage.", es: "Fallos técnicos críticos que impiden el uso de las funciones." },
                                            { en: "Administrative errors.", es: "Errores administrativos." },
                                        ].map((item, i) => (
                                            <li key={i} className="flex gap-3 text-zinc-300 text-sm bg-black/20 p-3 rounded-lg">
                                                <span className="text-brand-green">•</span> {lang === 'en' ? item.en : item.es}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="text-sm text-zinc-500 mt-4 p-4 bg-black/40 rounded-xl border border-white/5">
                                        <strong>{lang === 'en' ? "How to Request: " : "Cómo Solicitar: "}</strong>
                                        {lang === 'en'
                                            ? "Submit a support ticket categorized as 'Billing/Bug' detailing your issue. Our team analyzes these case-by-case."
                                            : "Envía un ticket de soporte categorizado como 'Billing/Bug' detallando tu problema. Nuestro equipo analiza estos casos uno por uno."
                                        }
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-600 italic text-center">
                                    {lang === 'en'
                                        ? "Terms Subject to Change: The platform reserves the right to modify this policy at any time, notifying users of active changes."
                                        : "Términos Sujetos a Cambios: La plataforma se reserva el derecho de modificar esta política en cualquier momento, notificando a los usuarios sobre cambios activos."
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case "staff":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Staff Role Hierarchy */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
                            <h2 className="text-2xl font-black uppercase text-white mb-6">
                                {lang === 'en' ? 'Staff Hierarchy & Permissions' : 'Jerarquía y Permisos del Staff'}
                            </h2>
                            <p className="text-zinc-400 mb-8 text-lg">
                                {lang === 'en'
                                    ? "Our staff team maintains a strict hierarchy to ensure fair moderation and accountability. Each role has specific permissions and responsibilities."
                                    : "Nuestro equipo de staff mantiene una jerarquía estricta para asegurar una moderación justa y responsabilidad. Cada rol tiene permisos y responsabilidades específicas."
                                }
                            </p>

                            <div className="grid gap-6">
                                {/* OWNER Role */}
                                <div className="bg-gradient-to-br from-brand-green/10 to-transparent border border-brand-green/30 rounded-2xl p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-brand-green flex items-center justify-center text-black font-bold text-xl">
                                            👑
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-brand-green uppercase">Owner</h3>
                                            <p className="text-zinc-500 text-sm">{lang === 'en' ? 'Platform Owner & Developer' : 'Dueño y Desarrollador de la Plataforma'}</p>
                                        </div>
                                    </div>
                                    <ul className="space-y-2 text-sm">
                                        {[
                                            { en: "Full access to all platform features", es: "Acceso completo a todas las funciones de la plataforma" },
                                            { en: "Can assign/remove Admin and Moderator roles", es: "Puede asignar/remover roles de Admin y Moderador" },
                                            { en: "Can delete ANY user account (except other Owners)", es: "Puede eliminar CUALQUIER cuenta de usuario (excepto otros Owners)" },
                                            { en: "Access to invite code generation system", es: "Acceso al sistema de generación de códigos de invitación" },
                                            { en: "Can create, edit, and award medals", es: "Puede crear, editar y otorgar medallas" },
                                            { en: "Server management and configuration", es: "Gestión y configuración de servidores" }
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-2 text-zinc-300">
                                                <span className="text-brand-green">✓</span>
                                                {lang === 'en' ? item.en : item.es}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* ADMIN Role */}
                                <div className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/30 rounded-2xl p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-xl">
                                            ⚙️
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-orange-400 uppercase">Admin</h3>
                                            <p className="text-zinc-500 text-sm">{lang === 'en' ? 'Senior Moderator & Manager' : 'Moderador Senior y Gestor'}</p>
                                        </div>
                                    </div>
                                    <ul className="space-y-2 text-sm">
                                        {[
                                            { en: "Can ban/unban players", es: "Puede banear/desbanear jugadores" },
                                            { en: "Can delete regular users and Moderators", es: "Puede eliminar usuarios regulares y Moderadores" },
                                            { en: "CANNOT delete other Admins or Owners", es: "NO PUEDE eliminar otros Admins u Owners" },
                                            { en: "Can promote users to Moderator", es: "Puede promover usuarios a Moderador" },
                                            { en: "Access to announcements and content editing", es: "Acceso a anuncios y edición de contenido" },
                                            { en: "Server status monitoring", es: "Monitoreo del estado de servidores" }
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-2 text-zinc-300">
                                                <span className="text-orange-400">✓</span>
                                                {lang === 'en' ? item.en : item.es}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* MODERATOR Role */}
                                <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/30 rounded-2xl p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                                            🛡️
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-blue-400 uppercase">Moderator</h3>
                                            <p className="text-zinc-500 text-sm">{lang === 'en' ? 'Community Moderator' : 'Moderador de la Comunidad'}</p>
                                        </div>
                                    </div>
                                    <ul className="space-y-2 text-sm">
                                        {[
                                            { en: "Can ban/unban players", es: "Puede banear/desbanear jugadores" },
                                            { en: "Can review and process reports", es: "Puede revisar y procesar reportes" },
                                            { en: "Can mute users in chat", es: "Puede silenciar usuarios en el chat" },
                                            { en: "CANNOT delete any user accounts", es: "NO PUEDE eliminar cuentas de usuario" },
                                            { en: "CANNOT change user roles", es: "NO PUEDE cambiar roles de usuario" },
                                            { en: "CANNOT access configuration sections", es: "NO PUEDE acceder a secciones de configuración" }
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-2 text-zinc-300">
                                                <span className={item.en.includes("CANNOT") ? "text-red-400" : "text-blue-400"}>
                                                    {item.en.includes("CANNOT") ? "✗" : "✓"}
                                                </span>
                                                {lang === 'en' ? item.en : item.es}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Staff Members */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
                            <h2 className="text-2xl font-black uppercase text-white mb-6">
                                {lang === 'en' ? 'Our Staff Team' : 'Nuestro Equipo de Staff'}
                            </h2>
                            <div className="grid gap-4">
                                {staff.map((member: any) => (
                                    <div key={member.name} className="flex flex-col md:flex-row gap-6 bg-zinc-900 border border-white/5 p-6 rounded-2xl items-center md:items-start text-center md:text-left hover:border-white/10 transition-colors">
                                        <div className="shrink-0 relative">
                                            <div className={cn("w-20 h-20 rounded-full border-2 overflow-hidden",
                                                member.role === 'OWNER' ? 'border-brand-green' : member.role === 'ADMIN' ? 'border-orange-500' : 'border-blue-500'
                                            )}>
                                                <Image src={member.image || "/default_avatar.jpg"} alt={member.name} width={80} height={80} className="object-cover h-full w-full" />
                                            </div>
                                            <div className={cn("absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                member.role === 'OWNER' ? 'bg-brand-green text-black' : member.role === 'ADMIN' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                                            )}>
                                                {member.role}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
                                            <p className="text-zinc-500 text-sm">
                                                {member.staffBio || (lang === 'en' ? "No bio available." : "Sin biografía disponible.")}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )

            case "profiles":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-8 space-y-8">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="text-3xl">👤</span> {lang === 'en' ? 'Your Player Profile' : 'Tu Perfil de Jugador'}
                                </h3>
                                <div className="text-zinc-400 leading-relaxed text-lg space-y-4">
                                    <p>
                                        {lang === 'en'
                                            ? "Your profile is your identity in the competitive ecosystem. It tracks granular statistics including average damage, kill involvement, and survival rates."
                                            : "Tu perfil es tu identidad en el ecosistema competitivo. Realiza un seguimiento de estadísticas granulares, incluyendo daño promedio, participación en asesinatos y tasas de supervivencia."
                                        }
                                    </p>
                                    <p>
                                        {lang === 'en'
                                            ? "As you progress, you will unlock customization options, badges, and distinct visual flairs to showcase your veteran status."
                                            : "A medida que progreses, desbloquearás opciones de personalización, insignias y estilos visuales distintivos para mostrar tu estatus de veterano."
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="h-px bg-white/5"></div>
                            <div className="bg-red-950/10 border border-red-500/20 p-8 rounded-2xl">
                                <h4 className="text-red-400 font-bold uppercase mb-4 flex items-center gap-2 text-lg">
                                    <AlertTriangle className="w-6 h-6" />
                                    {lang === 'en' ? 'Strict Account Responsibility' : 'Responsabilidad Estricta de la Cuenta'}
                                </h4>
                                <ul className="space-y-4">
                                    {[
                                        {
                                            title: { en: "You are the Guardian", es: "Tú eres el Guardián" },
                                            text: { en: "You are fully responsible for all actions taken on your account, regardless of who was using it at the time.", es: "Eres totalmente responsable de todas las acciones realizadas en tu cuenta, independientemente de quién la estuviera usando en ese momento." }
                                        },
                                        {
                                            title: { en: "No Sharing", es: "Prohibido Compartir" },
                                            text: { en: "Sharing accounts is strictly prohibited. Your stats and reputation must be yours alone.", es: "Compartir cuentas está estrictamente prohibido. Tus estadísticas y reputación deben ser solo tuyas." }
                                        },
                                        {
                                            title: { en: "Community Standards", es: "Estándares Comunitarios" },
                                            text: { en: "Respect is paramount. We do not tolerate hate speech, racism, or excessive toxicity.", es: "El respeto es primordial. No toleramos el discurso de odio, el racismo o la toxicidad excesiva." }
                                        },
                                        {
                                            title: { en: "Visual Decency", es: "Decencia Visual" },
                                            text: { en: "Offensive content in profiles, names, or Steam avatars will result in indefinite or temporary bans.", es: "El contenido ofensivo en perfiles, nombres o avatares de Steam resultará en baneos indefinidos o temporales." }
                                        }
                                    ].map((rule, i) => (
                                        <li key={i} className="flex gap-4">
                                            <span className="text-red-500/50 font-bold mt-1">0{i + 1}.</span>
                                            <div>
                                                <strong className="block text-red-200 uppercase text-sm mb-1">{lang === 'en' ? rule.title.en : rule.title.es}</strong>
                                                <span className="text-zinc-500 text-sm">{lang === 'en' ? rule.text.en : rule.text.es}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-6 pt-6 border-t border-red-500/10 text-center">
                                    <strong className="text-red-400/80 uppercase tracking-widest text-xs">
                                        {lang === 'en'
                                            ? "Repeat offenders face automatic, rapidly escalating bans."
                                            : "Los reincidentes enfrentan baneos automáticos de rápida escalada."
                                        }
                                    </strong>
                                </div>
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
                            <p className="text-zinc-400 text-lg mb-8">
                                {lang === 'en'
                                    ? "Encountered a gamebreaking bug? Found a player ruining the experience? Our support team is here to assist you."
                                    : "¿Encontraste un bug crítico? ¿Un jugador está arruinando la experiencia? Nuestro equipo de soporte está aquí para ayudarte."
                                }
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-brand-green/5 border border-brand-green/20 rounded-2xl p-6 flex flex-col items-center text-center hover:bg-brand-green/10 transition-colors">
                                    <div className="bg-brand-green text-black rounded-full p-4 mb-4">
                                        <Siren className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-bold text-brand-green uppercase mb-2 text-xl">
                                        {lang === 'en' ? 'Player Reports' : 'Reportar Jugador'}
                                    </h3>
                                    <p className="text-zinc-300 text-sm mb-4 leading-relaxed">
                                        {lang === 'en'
                                            ? "Use the 'Report' button found on the player's profile or in the match lobby."
                                            : "Usa el botón 'Reportar' que se encuentra en el perfil del jugador o en la sala de la partida."
                                        }
                                    </p>
                                    <span className="text-xs text-brand-green/60 font-mono bg-brand-green/5 px-2 py-1 rounded">
                                        {lang === 'en' ? "Require Evidence (Video)" : "Requiere Evidencia (Video)"}
                                    </span>
                                </div>

                                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 flex flex-col items-center text-center hover:bg-blue-500/10 transition-colors">
                                    <div className="bg-blue-500 text-white rounded-full p-4 mb-4">
                                        <HelpCircle className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-bold text-blue-400 uppercase mb-2 text-xl">
                                        {lang === 'en' ? 'General Help' : 'Ayuda General'}
                                    </h3>
                                    <p className="text-zinc-300 text-sm mb-4 leading-relaxed">
                                        {lang === 'en'
                                            ? "For bugs, billing issues, or feature requests, look for the Help widget in the bottom right."
                                            : "Para bugs, problemas de facturación o solicitudes, busca el widget de Ayuda en la esquina inferior derecha."
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
                            <p className="mb-8 text-zinc-400 text-lg">
                                {lang === 'en'
                                    ? "L4D2 Ranked stands on the shoulders of giants. We deeply appreciate the work of the following communities and developers who keep this game alive."
                                    : "L4D2 Ranked se apoya en hombros de gigantes. Agradecemos profundamente el trabajo de las siguientes comunidades y desarrolladores que mantienen vivo este juego."
                                }
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <a href="https://github.com/SirPlease/L4D2-Competitive-Rework" target="_blank" rel="noopener noreferrer"
                                    className="block relative h-64 rounded-2xl overflow-hidden border border-white/10 group hover:border-brand-green/50 transition-all shadow-2xl">
                                    <Image src="/credits/sirplease.png" alt="SirPlease ZoneMod" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col justify-end p-8">
                                        <h3 className="text-3xl font-black text-white uppercase tracking-widest mb-2 group-hover:text-brand-green transition-colors">SirPlease</h3>
                                        <p className="text-zinc-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 duration-300">
                                            {lang === 'en' ? "Creator of ZoneMod & Competitive Rework." : "Creador de ZoneMod y Rework Competitivo."}
                                        </p>
                                    </div>
                                </a>

                                <a href="https://www.alliedmods.net/" target="_blank" rel="noopener noreferrer"
                                    className="block relative h-64 rounded-2xl overflow-hidden border border-white/10 group hover:border-blue-500/50 transition-all shadow-2xl">
                                    <Image src="/credits/alliedmodders.png" alt="AlliedModders" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col justify-end p-8">
                                        <h3 className="text-3xl font-black text-white uppercase tracking-widest mb-2 group-hover:text-blue-500 transition-colors">AlliedModders</h3>
                                        <p className="text-zinc-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 duration-300">
                                            {lang === 'en' ? "The foundation of Source engine modification." : "La fundación del modding del motor Source."}
                                        </p>
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
