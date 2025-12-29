'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

const ADMIN_ROLES = ['OWNER', 'ADMIN'];

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: string;
    location: string;
    active: boolean;
    createdAt: string;
    expiresAt: string | null;
}

export default function AdminAnnouncementsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'INFO',
        location: 'HOME',
        expiresAt: ''
    });

    // @ts-expect-error - role is custom field
    const userRole = session?.user?.role;
    const canEdit = userRole && ADMIN_ROLES.includes(userRole);

    useEffect(() => {
        if (status === 'authenticated' && !canEdit) {
            router.push('/');
        }
    }, [status, canEdit, router]);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/announcements');
            const data = await res.json();
            if (data.success) {
                setAnnouncements(data.announcements);
            }
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                setShowForm(false);
                setFormData({ title: '', content: '', type: 'INFO', location: 'HOME', expiresAt: '' });
                fetchAnnouncements();
            } else {
                alert(data.error || 'Failed to create announcement');
            }
        } catch (error) {
            console.error('Create failed:', error);
        }
    };

    const handleToggle = async (id: string, active: boolean) => {
        try {
            const res = await fetch(`/api/admin/announcements/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !active })
            });
            if ((await res.json()).success) {
                fetchAnnouncements();
            }
        } catch (error) {
            console.error('Toggle failed:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this announcement?')) return;
        try {
            const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
            if ((await res.json()).success) {
                fetchAnnouncements();
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    if (status === 'loading' || !canEdit) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-24 pb-16 px-6">
                <div className="container mx-auto max-w-4xl">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="text-zinc-500 hover:text-white transition-colors">← Back</Link>
                            <h1 className="text-3xl font-black uppercase italic">📢 Announcements</h1>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="px-4 py-2 bg-brand-green text-black font-bold rounded-xl hover:bg-white transition-colors"
                        >
                            + New Announcement
                        </button>
                    </div>

                    {/* Create Form */}
                    {showForm && (
                        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-white/10 rounded-xl p-6 mb-8 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded p-3 text-white"
                                    >
                                        <option value="INFO">Info (Blue)</option>
                                        <option value="WARNING">Warning (Yellow)</option>
                                        <option value="MAINTENANCE">Maintenance (Red)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Location</label>
                                    <select
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded p-3 text-white"
                                    >
                                        <option value="HOME">Home Page</option>
                                        <option value="PLAY">Play Page</option>
                                        <option value="GLOBAL">All Pages</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-black border border-white/10 rounded p-3 text-white"
                                    placeholder="Announcement title"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Content</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full bg-black border border-white/10 rounded p-3 text-white resize-none"
                                    placeholder="Announcement message"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Expires At (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={formData.expiresAt}
                                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                    className="w-full bg-black border border-white/10 rounded p-3 text-white"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button type="submit" className="px-6 py-3 bg-brand-green text-black font-bold rounded-xl">
                                    Create
                                </button>
                                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 bg-zinc-800 text-zinc-400 font-bold rounded-xl">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {/* List */}
                    {loading ? (
                        <div className="text-center py-12 text-zinc-500">Loading...</div>
                    ) : announcements.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500">No announcements yet</div>
                    ) : (
                        <div className="space-y-4">
                            {announcements.map((ann) => (
                                <div key={ann.id} className={`border rounded-xl p-4 ${ann.type === 'MAINTENANCE' ? 'bg-red-500/10 border-red-500/30' :
                                        ann.type === 'WARNING' ? 'bg-yellow-500/10 border-yellow-500/30' :
                                            'bg-blue-500/10 border-blue-500/30'
                                    } ${!ann.active && 'opacity-50'}`}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-white">{ann.title}</span>
                                                <span className="text-xs px-2 py-0.5 bg-white/10 rounded">{ann.location}</span>
                                                {!ann.active && <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-500">Inactive</span>}
                                            </div>
                                            <p className="text-zinc-400 text-sm">{ann.content}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleToggle(ann.id, ann.active)}
                                                className="px-3 py-1 bg-zinc-800 border border-white/10 rounded text-sm"
                                            >
                                                {ann.active ? 'Disable' : 'Enable'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ann.id)}
                                                className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
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
