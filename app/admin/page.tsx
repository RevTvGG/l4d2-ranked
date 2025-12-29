import { redirect } from 'next/navigation';
import { getAdminRole } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const role = await getAdminRole();

    if (!role) {
        redirect('/');
    }

    // Fetch stats
    const [userCount, matchCount, reportCount, banCount] = await Promise.all([
        prisma.user.count(),
        prisma.match.count(),
        prisma.report.count({ where: { status: 'OPEN' } }),
        prisma.ban.count({ where: { active: true } })
    ]);

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-24 pb-16 px-6">
                <div className="container mx-auto max-w-6xl">

                    {/* Header */}
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">🛡️</span>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">
                                Admin Panel
                            </h1>
                        </div>
                        <p className="text-zinc-500">
                            Role: <span className="text-brand-green font-bold">{role}</span>
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                        <StatCard title="Total Users" value={userCount} icon="👤" />
                        <StatCard title="Total Matches" value={matchCount} icon="🎮" />
                        <StatCard title="Open Reports" value={reportCount} icon="📋" color="yellow" />
                        <StatCard title="Active Bans" value={banCount} icon="🚫" color="red" />
                    </div>

                    {/* Quick Actions */}
                    <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AdminLink href="/admin/players" icon="👥" title="Player Management" desc="Search, ban, and manage player roles" />
                        <AdminLink href="/admin/reports" icon="📋" title="Reports" desc="View and process user reports" />
                        <AdminLink href="/admin/announcements" icon="📢" title="Announcements" desc="Create and manage site announcements" />
                        <AdminLink href="/admin/content" icon="📝" title="Content Editor" desc="Edit site text and messages" />
                        <AdminLink href="/admin/chat" icon="💬" title="Chat Moderation" desc="Mute users and manage messages" />
                        <AdminLink href="/admin/servers" icon="🖥️" title="Servers" desc="View and manage game servers" />
                    </div>

                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color = 'green' }: { title: string, value: number, icon: string, color?: string }) {
    const colorClasses = {
        green: 'border-brand-green/30 bg-brand-green/5',
        yellow: 'border-yellow-500/30 bg-yellow-500/5',
        red: 'border-red-500/30 bg-red-500/5'
    };

    return (
        <div className={`p-6 rounded-xl border ${colorClasses[color as keyof typeof colorClasses]} backdrop-blur-sm`}>
            <div className="text-3xl mb-2">{icon}</div>
            <div className="text-3xl font-black text-white">{value.toLocaleString()}</div>
            <div className="text-sm text-zinc-500">{title}</div>
        </div>
    );
}

function AdminLink({ href, icon, title, desc }: { href: string, icon: string, title: string, desc: string }) {
    return (
        <Link href={href} className="p-6 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800 hover:border-white/10 transition-all group">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
            <h3 className="font-bold text-white mb-1 group-hover:text-brand-green transition-colors">{title}</h3>
            <p className="text-sm text-zinc-500">{desc}</p>
        </Link>
    );
}
