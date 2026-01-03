import { redirect } from 'next/navigation';
import { getAdminRole } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import StuckMatchesPanel from '@/components/admin/StuckMatchesPanel';

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

    // Calculate active matches (non-completed/cancelled)
    const activeMatches = await prisma.match.count({
        where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } }
    });

    return (
        <div className="min-h-screen bg-black text-white">

            <div className="pt-24 pb-16 px-6">
                <div className="container mx-auto max-w-7xl">

                    {/* Premium Header */}
                    <div className="mb-12 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-green/20 via-transparent to-transparent rounded-3xl blur-2xl"></div>
                        <div className="relative bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl p-8 overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/5 rounded-full blur-3xl"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-green to-emerald-600 flex items-center justify-center text-2xl shadow-lg shadow-brand-green/20">
                                                🛡️
                                            </div>
                                            <div>
                                                <h1 className="text-4xl font-black uppercase italic tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                                                    Admin Panel
                                                </h1>
                                                <p className="text-zinc-500 text-sm mt-1">
                                                    L4D2 Ranked Administration Dashboard
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="px-4 py-2 bg-zinc-800/50 rounded-xl border border-white/5">
                                            <span className="text-zinc-500 text-sm">Your Role</span>
                                            <div className={`font-bold uppercase text-lg ${role === 'OWNER' ? 'text-red-400' :
                                                role === 'ADMIN' ? 'text-orange-400' :
                                                    'text-blue-400'
                                                }`}>
                                                {role}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid - Premium Design */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                        <StatCard
                            title="Total Users"
                            value={userCount}
                            icon="👥"
                            color="green"
                            trend="+12%"
                        />
                        <StatCard
                            title="Total Matches"
                            value={matchCount}
                            icon="🎮"
                            color="blue"
                        />
                        <StatCard
                            title="Open Reports"
                            value={reportCount}
                            icon="📋"
                            color="yellow"
                            urgent={reportCount > 0}
                        />
                        <StatCard
                            title="Active Bans"
                            value={banCount}
                            icon="🚫"
                            color="red"
                        />
                    </div>

                    {/* Live Status Bar */}
                    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 mb-12 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-brand-green rounded-full animate-pulse"></span>
                                <span className="text-sm text-zinc-400">System Status: <span className="text-brand-green font-bold">Online</span></span>
                            </div>
                            <div className="hidden md:block h-4 w-px bg-white/10"></div>
                            <div className="text-sm text-zinc-400">
                                Active Matches: <span className="text-white font-bold">{activeMatches}</span>
                            </div>
                        </div>
                        <div className="text-xs text-zinc-600">
                            Last updated: {new Date().toLocaleTimeString()}
                        </div>
                    </div>

                    {/* Quick Actions Section */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                            <span className="w-8 h-1 bg-brand-green rounded-full"></span>
                            Quick Actions
                        </h2>

                        {/* Stuck Matches Panel */}
                        <StuckMatchesPanel />
                    </div>

                    {/* Panel Grid - Categories */}
                    <div className="space-y-8">
                        {/* Moderation Tools */}
                        <div>
                            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="text-lg">⚔️</span> Moderation
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <AdminCard
                                    href="/admin/players"
                                    icon="👥"
                                    title="Player Management"
                                    desc="Search, ban, delete and manage player roles"
                                    badge="Core"
                                />
                                <AdminCard
                                    href="/admin/bans"
                                    icon="⛔"
                                    title="Ban Management"
                                    desc="View, create, and remove player bans"
                                />
                                <AdminCard
                                    href="/admin/reports"
                                    icon="📋"
                                    title="Reports"
                                    desc="View and process user reports"
                                    badge={reportCount > 0 ? `${reportCount} pending` : undefined}
                                    badgeColor="yellow"
                                />
                                <AdminCard
                                    href="/admin/chat"
                                    icon="💬"
                                    title="Chat Moderation"
                                    desc="Mute users and manage messages"
                                />
                            </div>
                        </div>

                        {/* Admin/Owner Only Features */}
                        {role !== 'MODERATOR' && (
                            <div>
                                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="text-lg">⚙️</span> Configuration
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <AdminCard
                                        href="/admin/announcements"
                                        icon="📢"
                                        title="Announcements"
                                        desc="Create and manage site announcements"
                                    />
                                    <AdminCard
                                        href="/admin/content"
                                        icon="📝"
                                        title="Content Editor"
                                        desc="Edit site text and messages"
                                    />
                                    <AdminCard
                                        href="/admin/servers"
                                        icon="🖥️"
                                        title="Servers"
                                        desc="View and manage game servers"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Owner Only Features */}
                        {role === 'OWNER' && (
                            <div>
                                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="text-lg">👑</span> Owner Controls
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <AdminCard
                                        href="/admin/medals"
                                        icon="🏅"
                                        title="Medal Management"
                                        desc="Create, edit, and manage medals"
                                        badge="Exclusive"
                                        badgeColor="purple"
                                    />
                                    <AdminCard
                                        href="/admin/invites"
                                        icon="🎟️"
                                        title="Invite Codes"
                                        desc="Generate and manage beta access codes"
                                        badge="Beta System"
                                        badgeColor="green"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Resources */}
                        <div>
                            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="text-lg">📚</span> Resources
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <AdminCard
                                    href="/admin/guide"
                                    icon="📖"
                                    title="Admin Guide"
                                    desc="Documentation for all admin features"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Permission Summary */}
                    <div className="mt-12 bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
                        <h3 className="font-bold text-white mb-4 uppercase text-sm tracking-wider">Your Permissions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <span className={role === 'MODERATOR' || role === 'ADMIN' || role === 'OWNER' ? 'text-brand-green' : 'text-zinc-600'}>✓</span>
                                <span className={role === 'MODERATOR' || role === 'ADMIN' || role === 'OWNER' ? 'text-zinc-300' : 'text-zinc-600'}>Ban/Unban Players</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={role === 'MODERATOR' || role === 'ADMIN' || role === 'OWNER' ? 'text-brand-green' : 'text-zinc-600'}>✓</span>
                                <span className={role === 'MODERATOR' || role === 'ADMIN' || role === 'OWNER' ? 'text-zinc-300' : 'text-zinc-600'}>Manage Reports</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={role === 'MODERATOR' || role === 'ADMIN' || role === 'OWNER' ? 'text-brand-green' : 'text-zinc-600'}>✓</span>
                                <span className={role === 'MODERATOR' || role === 'ADMIN' || role === 'OWNER' ? 'text-zinc-300' : 'text-zinc-600'}>Mute Users</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={role === 'ADMIN' || role === 'OWNER' ? 'text-brand-green' : 'text-zinc-600'}>✓</span>
                                <span className={role === 'ADMIN' || role === 'OWNER' ? 'text-zinc-300' : 'text-zinc-600'}>Delete Users (non-admin)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={role === 'ADMIN' || role === 'OWNER' ? 'text-brand-green' : 'text-zinc-600'}>✓</span>
                                <span className={role === 'ADMIN' || role === 'OWNER' ? 'text-zinc-300' : 'text-zinc-600'}>Manage Content</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={role === 'OWNER' ? 'text-brand-green' : 'text-zinc-600'}>✓</span>
                                <span className={role === 'OWNER' ? 'text-zinc-300' : 'text-zinc-600'}>Manage Admins & Medals</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    color = 'green',
    trend,
    urgent
}: {
    title: string,
    value: number,
    icon: string,
    color?: string,
    trend?: string,
    urgent?: boolean
}) {
    const colorClasses = {
        green: 'from-brand-green/20 to-brand-green/5 border-brand-green/30',
        blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
        yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30',
        red: 'from-red-500/20 to-red-500/5 border-red-500/30'
    };

    const iconBgClasses = {
        green: 'bg-brand-green/20',
        blue: 'bg-blue-500/20',
        yellow: 'bg-yellow-500/20',
        red: 'bg-red-500/20'
    };

    return (
        <div className={`relative p-6 rounded-2xl border bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} backdrop-blur-sm overflow-hidden group hover:scale-[1.02] transition-transform`}>
            {urgent && (
                <div className="absolute top-3 right-3">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                    </span>
                </div>
            )}
            <div className={`w-12 h-12 rounded-xl ${iconBgClasses[color as keyof typeof iconBgClasses]} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div className="text-4xl font-black text-white mb-1">{value.toLocaleString()}</div>
            <div className="text-sm text-zinc-500 flex items-center gap-2">
                {title}
                {trend && <span className="text-xs text-brand-green">{trend}</span>}
            </div>
        </div>
    );
}

function AdminCard({
    href,
    icon,
    title,
    desc,
    badge,
    badgeColor = 'blue'
}: {
    href: string,
    icon: string,
    title: string,
    desc: string,
    badge?: string,
    badgeColor?: string
}) {
    const badgeClasses = {
        blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        green: 'bg-brand-green/20 text-brand-green border-brand-green/30',
        yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        red: 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    return (
        <Link
            href={href}
            className="group relative p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/5 rounded-2xl hover:border-brand-green/30 transition-all hover:shadow-lg hover:shadow-brand-green/5 overflow-hidden"
        >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-green/0 to-brand-green/0 group-hover:from-brand-green/5 group-hover:to-transparent transition-all"></div>

            <div className="relative z-10">
                {badge && (
                    <span className={`absolute top-0 right-0 text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${badgeClasses[badgeColor as keyof typeof badgeClasses]}`}>
                        {badge}
                    </span>
                )}
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl mb-4 group-hover:bg-brand-green/10 group-hover:scale-110 transition-all">
                    {icon}
                </div>
                <h3 className="font-bold text-white mb-1 group-hover:text-brand-green transition-colors">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
            </div>
        </Link>
    );
}
