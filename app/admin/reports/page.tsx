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
    createdAt: string;
    user: {
        name: string;
        steamId: string;
    };
}

export default function AdminReportsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('OPEN');

    // @ts-expect-error - role is custom field
    const userRole = session?.user?.role;
    const isAdmin = userRole && ADMIN_ROLES.includes(userRole);

    useEffect(() => {
        if (status === 'authenticated' && !isAdmin) {
            router.push('/');
        }
    }, [status, isAdmin, router]);

    useEffect(() => {
        fetchReports();
    }, [filter]);

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

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/admin/reports/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if ((await res.json()).success) {
                fetchReports();
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

                    {/* Filter */}
                    <div className="flex gap-2 mb-6">
                        {['OPEN', 'REVIEWING', 'CLOSED'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${filter === s ? 'bg-brand-green text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    {loading ? (
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
                                                <span className="font-bold text-white">{report.title}</span>
                                            </div>
                                            <p className="text-zinc-400 text-sm mb-2">{report.content}</p>
                                            {report.target && (
                                                <p className="text-xs text-zinc-500">
                                                    Target: <span className="text-red-400">{report.target}</span>
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
                                                onChange={(e) => handleStatusChange(report.id, e.target.value)}
                                                className="bg-zinc-800 border border-white/10 rounded px-3 py-1 text-sm text-white"
                                            >
                                                <option value="OPEN">Open</option>
                                                <option value="REVIEWING">Reviewing</option>
                                                <option value="CLOSED">Closed</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="text-xs text-zinc-600">
                                        ID: {report.id} | Created: {new Date(report.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
