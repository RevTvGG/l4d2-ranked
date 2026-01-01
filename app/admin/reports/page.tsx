'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

const ADMIN_ROLES = ['OWNER', 'ADMIN', 'MODERATOR'];

interface Report {
    id: string;
    type: string;
    title: string;
    content: string;
    evidence: string | null;
    target: string | null;
    status: string;
    isPremium: boolean;
    subType: string | null;
    matchId: string | null;
    createdAt: string;
    user: {
        name: string;
        steamId: string;
    };
}

interface UserReport {
    id: string;
    reason: string;
    description: string | null;
    status: string;
    isPremium: boolean;
    matchId: string | null;
    createdAt: string;
    reporter: {
        name: string;
        steamId: string;
    };
    reported: {
        name: string;
        steamId: string;
    };
}

export default function AdminReportsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [userReports, setUserReports] = useState<UserReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('OPEN');
    const [tab, setTab] = useState<'general' | 'player'>('general');

    const userRole = (session?.user as any)?.role;
    const isAdmin = userRole && ADMIN_ROLES.includes(userRole);

    useEffect(() => {
        if (status === 'authenticated' && !isAdmin) {
            router.push('/');
        }
    }, [status, isAdmin, router]);

    useEffect(() => {
        if (tab === 'general') {
            fetchReports();
        } else {
            fetchUserReports();
        }
    }, [filter, tab]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/reports?status=${filter}`);
            const data = await res.json();
            if (data.success) {
                setReports(data.reports);
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserReports = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/user-reports?status=${filter}`);
            const data = await res.json();
            if (data.success) {
                setUserReports(data.reports);
            }
        } catch (error) {
            console.error('Failed to fetch user reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string, isUserReport: boolean = false) => {
        try {
            const endpoint = isUserReport ? `/api/admin/user-reports/${id}` : `/api/admin/reports/${id}`;
            const res = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if ((await res.json()).success) {
                if (isUserReport) {
                    fetchUserReports();
                } else {
                    fetchReports();
                }
            }
        } catch (error) {
            console.error('Status change failed:', error);
        }
    };

    if (status === 'loading' || !isAdmin) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'BUG': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'PLAYER': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        }
    };

    const getReasonColor = (reason: string) => {
        switch (reason) {
            case 'CHEATING': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'TROLLING': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
        }
    };

    const generalStatuses = ['OPEN', 'REVIEWING', 'CLOSED'];
    const playerStatuses = ['PENDING', 'REVIEWED', 'ACTION_TAKEN', 'DISMISSED'];

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-24 pb-16 px-6">
                <div className="container mx-auto max-w-4xl">

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/admin" className="text-zinc-500 hover:text-white transition-colors">← Back</Link>
                        <h1 className="text-3xl font-black uppercase italic">📋 Reports</h1>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
                        <button
                            onClick={() => { setTab('general'); setFilter('OPEN'); }}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${tab === 'general'
                                ? 'bg-brand-green text-black'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            🐛 Bug / Feedback
                        </button>
                        <button
                            onClick={() => { setTab('player'); setFilter('PENDING'); }}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${tab === 'player'
                                ? 'bg-red-500 text-white'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            🚨 Player Reports
                        </button>
                    </div>

                    {/* Filter */}
                    <div className="flex gap-2 mb-6">
                        {(tab === 'general' ? generalStatuses : playerStatuses).map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${filter === s ? 'bg-brand-green text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                    }`}
                            >
                                {s.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {/* General Reports List */}
                    {tab === 'general' && (
                        loading ? (
                            <div className="text-center py-12 text-zinc-500">Loading...</div>
                        ) : reports.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500">No {filter.toLowerCase()} reports</div>
                        ) : (
                            <div className="space-y-4">
                                {reports.map((report) => (
                                    <div key={report.id} className="bg-zinc-900 border border-white/5 rounded-xl p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-xs px-2 py-1 rounded border font-bold ${getTypeColor(report.type)}`}>
                                                        {report.type}
                                                    </span>
                                                    {report.subType && (
                                                        <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400">
                                                            {report.subType.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                    {report.isPremium && (
                                                        <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                            ⭐ Premium
                                                        </span>
                                                    )}
                                                    <span className="font-bold text-white">{report.title}</span>
                                                </div>
                                                <p className="text-zinc-400 text-sm mb-2">{report.content}</p>
                                                {report.target && (
                                                    <p className="text-xs text-zinc-500">
                                                        Target: <span className="text-red-400">{report.target}</span>
                                                    </p>
                                                )}
                                                {report.matchId && (
                                                    <p className="text-xs text-zinc-500">
                                                        Match: <span className="text-blue-400 font-mono">{report.matchId}</span>
                                                    </p>
                                                )}
                                                {report.evidence && (
                                                    <a href={report.evidence} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                                                        📎 View Evidence
                                                    </a>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-zinc-500 mb-2">
                                                    By: {report.user.name}
                                                </p>
                                                <select
                                                    value={report.status}
                                                    onChange={(e) => handleStatusChange(report.id, e.target.value, false)}
                                                    className="bg-zinc-800 border border-white/10 rounded px-3 py-1 text-sm text-white"
                                                >
                                                    {generalStatuses.map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="text-xs text-zinc-600">
                                            ID: {report.id} | Created: {new Date(report.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* Player Reports List */}
                    {tab === 'player' && (
                        loading ? (
                            <div className="text-center py-12 text-zinc-500">Loading...</div>
                        ) : userReports.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500">No {filter.toLowerCase().replace('_', ' ')} reports</div>
                        ) : (
                            <div className="space-y-4">
                                {userReports.map((report) => (
                                    <div key={report.id} className="bg-zinc-900 border border-white/5 rounded-xl p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-xs px-2 py-1 rounded border font-bold ${getReasonColor(report.reason)}`}>
                                                        {report.reason}
                                                    </span>
                                                    {report.isPremium && (
                                                        <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                            ⭐ Premium
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mb-2 text-sm">
                                                    <div>
                                                        <span className="text-zinc-500">Reporter:</span>{' '}
                                                        <Link href={`/profile/${encodeURIComponent(report.reporter.name)}`} className="text-white hover:text-brand-green">
                                                            {report.reporter.name}
                                                        </Link>
                                                    </div>
                                                    <span className="text-zinc-600">→</span>
                                                    <div>
                                                        <span className="text-zinc-500">Reported:</span>{' '}
                                                        <Link href={`/profile/${encodeURIComponent(report.reported.name)}`} className="text-red-400 hover:text-red-300">
                                                            {report.reported.name}
                                                        </Link>
                                                    </div>
                                                </div>
                                                {report.description && (
                                                    <p className="text-zinc-400 text-sm mb-2">{report.description}</p>
                                                )}
                                                {report.matchId && (
                                                    <p className="text-xs text-zinc-500">
                                                        Match: <span className="text-blue-400 font-mono">{report.matchId}</span>
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <select
                                                    value={report.status}
                                                    onChange={(e) => handleStatusChange(report.id, e.target.value, true)}
                                                    className="bg-zinc-800 border border-white/10 rounded px-3 py-1 text-sm text-white"
                                                >
                                                    {playerStatuses.map(s => (
                                                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="text-xs text-zinc-600">
                                            ID: {report.id} | Created: {new Date(report.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
