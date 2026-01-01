import { redirect } from 'next/navigation';
import { getAdminRole } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { ForceReleaseButton } from './ServerActions';

export const dynamic = 'force-dynamic';

export default async function AdminServersPage() {
    const role = await getAdminRole();

    if (!role) {
        redirect('/');
    }

    // Fetch servers with their current active matches
    const servers = await prisma.gameServer.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            currentMatches: {
                where: {
                    status: { in: ['READY', 'IN_PROGRESS'] }
                },
                take: 1,
                select: { id: true, status: true }
            }
        }
    });

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-24 pb-16 px-6">
                <div className="container mx-auto max-w-4xl">

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/admin" className="text-zinc-500 hover:text-white transition-colors">← Back</Link>
                        <h1 className="text-3xl font-black uppercase italic">🖥️ Game Servers</h1>
                    </div>

                    {/* Server List */}
                    {servers.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500 bg-zinc-900/50 rounded-xl border border-white/5">
                            No servers configured
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {servers.map((server) => {
                                const activeMatch = server.currentMatches[0];
                                return (
                                    <div key={server.id} className={`bg-zinc-900 border rounded-xl p-6 ${server.status === 'AVAILABLE' ? 'border-brand-green/30' :
                                        server.status === 'IN_USE' ? 'border-yellow-500/30' :
                                            server.status === 'MAINTENANCE' ? 'border-orange-500/30' :
                                                'border-red-500/30'
                                        }`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="font-bold text-xl text-white">{server.name}</h3>
                                                <p className="text-zinc-500 font-mono">{server.ipAddress}:{server.port}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full font-bold text-sm ${server.status === 'AVAILABLE' ? 'bg-brand-green/20 text-brand-green' :
                                                    server.status === 'IN_USE' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        server.status === 'MAINTENANCE' ? 'bg-orange-500/20 text-orange-400' :
                                                            'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {server.status}
                                                </span>
                                                {server.status === 'IN_USE' && (
                                                    <ForceReleaseButton serverId={server.id} />
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="text-zinc-500">Server Key:</span>
                                                <span className="ml-2 text-white font-mono text-xs">{server.serverKey}</span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-500">Current Match:</span>
                                                <span className="ml-2 text-white">
                                                    {activeMatch ? (
                                                        <span className="text-yellow-400">{activeMatch.status}</span>
                                                    ) : (
                                                        <span className="text-green-400">None (Free)</span>
                                                    )}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-500">Created:</span>
                                                <span className="ml-2 text-white">{new Date(server.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {activeMatch && (
                                            <div className="mt-4 pt-4 border-t border-white/5">
                                                <span className="text-xs text-zinc-500">Match ID: </span>
                                                <span className="text-xs text-white font-mono">{activeMatch.id}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Info */}
                    <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-200 text-sm">
                        <strong>Note:</strong> To add or modify servers, use the database directly via Prisma Studio or the API.
                        Server management API is not yet implemented.
                    </div>
                </div>
            </div>
        </div>
    );
}
