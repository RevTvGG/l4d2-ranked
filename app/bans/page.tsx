import { prisma } from '@/lib/prisma';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function PublicBansPage() {
    const bans = await prisma.ban.findMany({
        where: {
            active: true,
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ]
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
            user: {
                select: {
                    name: true,
                    image: true
                }
            },
            bannedBy: {
                select: { name: true }
            }
        }
    });

    const formatDuration = (minutes: number) => {
        if (minutes === 0) return 'Permanent';
        if (minutes < 60) return `${minutes}m`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
        return `${Math.floor(minutes / 1440)}d`;
    };

    const formatReason = (reason: string) => {
        const labels: Record<string, { icon: string; text: string; color: string }> = {
            'AFK_ACCEPT': { icon: '⏰', text: 'AFK (Ready)', color: 'text-yellow-400' },
            'NO_JOIN': { icon: '🚫', text: 'No Join', color: 'text-orange-400' },
            'CRASH': { icon: '💥', text: 'Crash', color: 'text-blue-400' },
            'MANUAL': { icon: '🔧', text: 'Manual', color: 'text-zinc-400' },
            'TROLLING': { icon: '🤡', text: 'Trolling', color: 'text-purple-400' },
            'CHEATING': { icon: '🎮', text: 'Cheating', color: 'text-red-400' }
        };
        return labels[reason] || { icon: '❓', text: reason, color: 'text-zinc-400' };
    };

    const formatTimeRemaining = (expiresAt: Date | null) => {
        if (!expiresAt) return 'Never';
        const now = new Date();
        const diff = expiresAt.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white">

            {/* Hero */}
            <div className="relative py-24 overflow-hidden border-b border-white/5 bg-zinc-900/50">
                <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 to-transparent"></div>
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-6 uppercase">
                        ⛔ <span className="text-red-500">Ban</span> List
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Players currently banned from L4D2 Ranked matchmaking.
                    </p>
                    <div className="mt-6 inline-block px-6 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <span className="text-2xl font-black text-red-400">{bans.length}</span>
                        <span className="text-zinc-500 ml-2">Active Bans</span>
                    </div>
                </div>
            </div>

            {/* Bans List */}
            <div className="container mx-auto px-6 py-16">
                {bans.length === 0 ? (
                    <div className="text-center py-16 bg-zinc-900/50 rounded-2xl border border-white/5">
                        <span className="text-6xl mb-4 block">✨</span>
                        <h2 className="text-2xl font-bold text-white">No Active Bans</h2>
                        <p className="text-zinc-500 mt-2">The community is behaving well!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-4 px-4 text-xs font-bold text-zinc-500 uppercase">Player</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold text-zinc-500 uppercase">Reason</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold text-zinc-500 uppercase">Duration</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold text-zinc-500 uppercase">Expires</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold text-zinc-500 uppercase">Banned By</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold text-zinc-500 uppercase">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bans.map((ban) => {
                                    const reasonInfo = formatReason(ban.reason);
                                    return (
                                        <tr key={ban.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800">
                                                        {ban.user.image ? (
                                                            <Image src={ban.user.image} alt="" width={40} height={40} className="object-cover" unoptimized />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                                                {ban.user.name?.[0]?.toUpperCase() || '?'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-white">{ban.user.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`font-bold ${reasonInfo.color}`}>
                                                    {reasonInfo.icon} {reasonInfo.text}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="font-mono text-white">{formatDuration(ban.duration)}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={ban.expiresAt ? 'text-yellow-400' : 'text-red-400'}>
                                                    {formatTimeRemaining(ban.expiresAt)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-zinc-400">{ban.bannedBy?.name || 'System'}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-zinc-500 text-sm">
                                                    {new Date(ban.createdAt).toLocaleDateString()}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Info */}
                <div className="mt-12 p-6 bg-zinc-900/50 rounded-xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4">📋 Ban Reasons</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div><span className="text-yellow-400">⏰ AFK</span> - Failed to accept ready check</div>
                        <div><span className="text-orange-400">🚫 No Join</span> - Did not connect to server</div>
                        <div><span className="text-blue-400">💥 Crash</span> - Disconnected without rejoining</div>
                        <div><span className="text-purple-400">🤡 Trolling</span> - Intentionally disrupting games</div>
                        <div><span className="text-red-400">🎮 Cheating</span> - Using cheats or exploits</div>
                        <div><span className="text-zinc-400">🔧 Manual</span> - Admin issued ban</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
