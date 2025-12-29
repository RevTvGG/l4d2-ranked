'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

const ADMIN_ROLES = ['OWNER', 'ADMIN', 'MODERATOR'];

export default function AdminGuidePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // @ts-expect-error - role is custom field
    const userRole = session?.user?.role;
    const isAdmin = userRole && ADMIN_ROLES.includes(userRole);

    useEffect(() => {
        if (status === 'authenticated' && !isAdmin) {
            router.push('/');
        }
    }, [status, isAdmin, router]);

    if (status === 'loading' || !isAdmin) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-24 pb-16 px-6">
                <div className="container mx-auto max-w-4xl">

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/admin" className="text-zinc-500 hover:text-white transition-colors">← Back</Link>
                        <h1 className="text-3xl font-black uppercase italic">📖 Admin Guide</h1>
                    </div>

                    {/* Quick Access */}
                    <div className="bg-gradient-to-r from-brand-green/10 to-emerald-500/10 border border-brand-green/20 rounded-2xl p-6 mb-8">
                        <h2 className="text-lg font-bold text-brand-green mb-3">🔗 Quick Access</h2>
                        <div className="flex flex-wrap gap-3">
                            <Link href="/admin" className="px-4 py-2 bg-black/50 rounded-lg hover:bg-black transition-colors">🏠 Dashboard</Link>
                            <Link href="/admin/players" className="px-4 py-2 bg-black/50 rounded-lg hover:bg-black transition-colors">👥 Players</Link>
                            <Link href="/admin/bans" className="px-4 py-2 bg-black/50 rounded-lg hover:bg-black transition-colors">⛔ Bans</Link>
                            <Link href="/admin/servers" className="px-4 py-2 bg-black/50 rounded-lg hover:bg-black transition-colors">🖥️ Servers</Link>
                            <Link href="/admin/reports" className="px-4 py-2 bg-black/50 rounded-lg hover:bg-black transition-colors">📋 Reports</Link>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-8">

                        {/* Section: Ban System */}
                        <Section title="⛔ Sistema de Bans" icon="🚫">
                            <p className="text-zinc-400 mb-4">
                                El sistema de bans permite bloquear jugadores de participar en partidas rankeadas.
                            </p>

                            <SubSection title="Tipos de Ban">
                                <ul className="list-disc list-inside text-zinc-400 space-y-2">
                                    <li><strong className="text-yellow-400">AFK (Ready Check)</strong> - No aceptó el ready check a tiempo</li>
                                    <li><strong className="text-orange-400">No Join</strong> - No se conectó al servidor después de ser asignado</li>
                                    <li><strong className="text-red-400">Crash</strong> - Se desconectó y no volvió a conectarse</li>
                                    <li><strong className="text-purple-400">Trolling</strong> - Comportamiento tóxico o griefing</li>
                                    <li><strong className="text-red-500">Cheating</strong> - Uso de hacks o exploits</li>
                                    <li><strong className="text-zinc-400">Manual</strong> - Ban manual por admin (otros motivos)</li>
                                </ul>
                            </SubSection>

                            <SubSection title="Duraciones">
                                <ul className="list-disc list-inside text-zinc-400 space-y-1">
                                    <li>15 minutos a 1 año</li>
                                    <li><strong className="text-red-500">Permanente</strong> - Solo para casos graves (cheating confirmado)</li>
                                </ul>
                            </SubSection>

                            <SubSection title="Cómo Banear">
                                <ol className="list-decimal list-inside text-zinc-400 space-y-2">
                                    <li>Ve a <strong>Player Management</strong> o <strong>Ban Management</strong></li>
                                    <li>Busca al jugador por nombre o SteamID</li>
                                    <li>Haz clic en <span className="text-red-400">🚫 Ban</span></li>
                                    <li>Selecciona razón, duración y descripción opcional</li>
                                    <li>Confirma el ban</li>
                                </ol>
                            </SubSection>

                            <SubSection title="Cómo Desbanear">
                                <ol className="list-decimal list-inside text-zinc-400 space-y-2">
                                    <li>Ve a <strong>Ban Management</strong> (filtro: Active)</li>
                                    <li>Busca el ban del jugador</li>
                                    <li>Haz clic en <span className="text-brand-green">Unban</span></li>
                                    <li>Confirma la acción</li>
                                </ol>
                            </SubSection>

                            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                                <p className="text-yellow-400 text-sm">
                                    ⚠️ <strong>Nota:</strong> Si un jugador tiene múltiples bans activos (bug anterior), deberás desbanear cada uno manualmente.
                                </p>
                            </div>
                        </Section>

                        {/* Section: Player Management */}
                        <Section title="👥 Gestión de Jugadores" icon="👤">
                            <SubSection title="Búsqueda">
                                <p className="text-zinc-400">
                                    Puedes buscar jugadores por nombre exacto o por SteamID (76561198...).
                                </p>
                            </SubSection>

                            <SubSection title="Cambiar Rol (Solo Owner)">
                                <ul className="list-disc list-inside text-zinc-400 space-y-1">
                                    <li><strong>Newcomer</strong> - Usuario normal</li>
                                    <li><strong>Moderator</strong> - Puede ver reportes y banear</li>
                                    <li><strong>Admin</strong> - Acceso completo al panel</li>
                                    <li><strong>Owner</strong> - Solo tú (no se puede cambiar)</li>
                                </ul>
                            </SubSection>
                        </Section>

                        {/* Section: Servers */}
                        <Section title="🖥️ Servidores" icon="💻">
                            <SubSection title="Estados">
                                <ul className="list-disc list-inside text-zinc-400 space-y-1">
                                    <li><span className="text-brand-green">● AVAILABLE</span> - Listo para asignar partidas</li>
                                    <li><span className="text-yellow-400">● IN_USE</span> - Partida en progreso</li>
                                    <li><span className="text-red-400">● OFFLINE</span> - No responde</li>
                                    <li><span className="text-orange-400">● MAINTENANCE</span> - En mantenimiento</li>
                                </ul>
                            </SubSection>

                            <SubSection title="Server Key">
                                <p className="text-zinc-400">
                                    Cada servidor tiene un <code className="bg-zinc-800 px-2 py-0.5 rounded">Server Key</code> único que se usa para autenticar las peticiones del plugin SourceMod.
                                    <strong className="text-red-400"> No compartas esta key.</strong>
                                </p>
                            </SubSection>
                        </Section>

                        {/* Section: Reports */}
                        <Section title="📋 Reportes" icon="📝">
                            <SubSection title="Tipos de Reporte">
                                <ul className="list-disc list-inside text-zinc-400 space-y-1">
                                    <li><strong className="text-red-400">CHEATING</strong> - Sospecha de hacks</li>
                                    <li><strong className="text-orange-400">TROLLING</strong> - Comportamiento tóxico</li>
                                </ul>
                            </SubSection>

                            <SubSection title="Estados">
                                <ul className="list-disc list-inside text-zinc-400 space-y-1">
                                    <li><strong>PENDING</strong> - Sin revisar</li>
                                    <li><strong>REVIEWED</strong> - Revisado, sin acción</li>
                                    <li><strong>ACTION_TAKEN</strong> - Se aplicó un ban</li>
                                    <li><strong>DISMISSED</strong> - Reporte inválido</li>
                                </ul>
                            </SubSection>
                        </Section>

                        {/* Section: Queue System */}
                        <Section title="🎮 Sistema de Cola" icon="⏳">
                            <p className="text-zinc-400 mb-4">
                                El sistema de matchmaking automáticamente:
                            </p>
                            <ul className="list-disc list-inside text-zinc-400 space-y-2">
                                <li>Agrupa 8 jugadores cuando hay suficientes en cola</li>
                                <li>Balancea equipos por rating (ELO)</li>
                                <li>Asigna un servidor disponible</li>
                                <li>Inicia votación de mapa</li>
                            </ul>

                            <div className="mt-4 p-4 bg-brand-green/10 border border-brand-green/20 rounded-xl">
                                <p className="text-brand-green text-sm">
                                    ✅ Los jugadores baneados <strong>no pueden</strong> unirse a la cola.
                                </p>
                            </div>
                        </Section>

                        {/* Section: Auto-Ban */}
                        <Section title="🤖 Auto-Ban (Robocop)" icon="⚡">
                            <p className="text-zinc-400 mb-4">
                                El sistema automáticamente banea jugadores por:
                            </p>
                            <ul className="list-disc list-inside text-zinc-400 space-y-2">
                                <li><strong>AFK en Ready Check</strong> - Si no acepta en 30 segundos</li>
                                <li><strong>No conectarse al servidor</strong> - Si no se une después de ser asignado</li>
                                <li><strong>Desconexión sin reconexión</strong> - Si se desconecta y no vuelve en 5 minutos</li>
                            </ul>

                            <SubSection title="Escalado de Duración">
                                <p className="text-zinc-400 mb-2">Las duraciones aumentan con cada reincidencia:</p>
                                <div className="bg-zinc-900 rounded-xl p-4 overflow-x-auto">
                                    <table className="text-sm w-full">
                                        <thead>
                                            <tr className="text-zinc-500 text-left">
                                                <th className="pb-2">Ofensa</th>
                                                <th className="pb-2">AFK</th>
                                                <th className="pb-2">No Join</th>
                                                <th className="pb-2">Crash</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-zinc-400">
                                            <tr><td>1ª</td><td>15m</td><td>30m</td><td>1h</td></tr>
                                            <tr><td>2ª</td><td>1h</td><td>2h</td><td>3h</td></tr>
                                            <tr><td>3ª</td><td>3h</td><td>6h</td><td>12h</td></tr>
                                            <tr><td>4ª</td><td>12h</td><td>1d</td><td>1d</td></tr>
                                            <tr><td>5ª+</td><td>1d</td><td>3d</td><td>3d</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </SubSection>
                        </Section>

                        {/* Section: Permissions */}
                        <Section title="🔐 Permisos por Rol" icon="🛡️">
                            <div className="bg-zinc-900 rounded-xl p-4 overflow-x-auto">
                                <table className="text-sm w-full">
                                    <thead>
                                        <tr className="text-zinc-500 text-left">
                                            <th className="pb-2">Función</th>
                                            <th className="pb-2 text-center">MOD</th>
                                            <th className="pb-2 text-center">ADMIN</th>
                                            <th className="pb-2 text-center">OWNER</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-zinc-400">
                                        <tr><td>Ver Dashboard</td><td className="text-center">✅</td><td className="text-center">✅</td><td className="text-center">✅</td></tr>
                                        <tr><td>Ver Reportes</td><td className="text-center">✅</td><td className="text-center">✅</td><td className="text-center">✅</td></tr>
                                        <tr><td>Banear Jugadores</td><td className="text-center">✅</td><td className="text-center">✅</td><td className="text-center">✅</td></tr>
                                        <tr><td>Desbanear Jugadores</td><td className="text-center">✅</td><td className="text-center">✅</td><td className="text-center">✅</td></tr>
                                        <tr><td>Gestionar Servidores</td><td className="text-center">❌</td><td className="text-center">✅</td><td className="text-center">✅</td></tr>
                                        <tr><td>Cambiar Roles</td><td className="text-center">❌</td><td className="text-center">❌</td><td className="text-center">✅</td></tr>
                                        <tr><td>Editar Contenido</td><td className="text-center">❌</td><td className="text-center">✅</td><td className="text-center">✅</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </Section>

                        {/* Footer */}
                        <div className="text-center text-zinc-600 text-sm pt-8 border-t border-white/5">
                            <p>Esta guía es exclusiva para el equipo de administración.</p>
                            <p className="mt-1">Última actualización: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">{icon}</span> {title}
            </h2>
            {children}
        </div>
    );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mt-4">
            <h3 className="text-sm font-bold text-brand-green uppercase tracking-wider mb-2">{title}</h3>
            {children}
        </div>
    );
}
