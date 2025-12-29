'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

const ADMIN_ROLES = ['OWNER', 'ADMIN'];

interface ContentItem {
    id: string;
    key: string;
    content: string;
    updatedAt: string;
}

// Default content keys for the site
const DEFAULT_KEYS = [
    { key: 'home_hero_title', label: 'Home Hero Title', default: 'COMPETITIVE L4D2' },
    { key: 'home_hero_subtitle', label: 'Home Hero Subtitle', default: 'Fair matches. Skill-based ranking. Real competition.' },
    { key: 'play_page_title', label: 'Play Page Title', default: 'MATCHMAKING' },
    { key: 'server_news', label: '📢 Server News (Play Page)', default: "Don't forget to join our Discord for tournament announcements. Season 1 ends in 2 weeks!" },
    { key: 'maintenance_message', label: 'Maintenance Message', default: '' },
];

export default function AdminContentPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [contents, setContents] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [editedValues, setEditedValues] = useState<Record<string, string>>({});

    // @ts-expect-error - role is custom field
    const userRole = session?.user?.role;
    const canEdit = userRole && ADMIN_ROLES.includes(userRole);

    useEffect(() => {
        if (status === 'authenticated' && !canEdit) {
            router.push('/');
        }
    }, [status, canEdit, router]);

    useEffect(() => {
        fetchContents();
    }, []);

    const fetchContents = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/content');
            const data = await res.json();
            if (data.success) {
                setContents(data.contents);
                // Initialize edited values
                const values: Record<string, string> = {};
                data.contents.forEach((c: ContentItem) => {
                    values[c.key] = c.content;
                });
                setEditedValues(values);
            }
        } catch (error) {
            console.error('Failed to fetch contents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (key: string) => {
        setSaving(key);
        try {
            const res = await fetch('/api/admin/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, content: editedValues[key] })
            });
            const data = await res.json();
            if (data.success) {
                fetchContents();
            } else {
                alert(data.error || 'Failed to save');
            }
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setSaving(null);
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
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/admin" className="text-zinc-500 hover:text-white transition-colors">← Back</Link>
                        <h1 className="text-3xl font-black uppercase italic">📝 Content Editor</h1>
                    </div>

                    <p className="text-zinc-500 mb-8">
                        Edit site text and messages. Changes are saved immediately.
                    </p>

                    {/* List */}
                    {loading ? (
                        <div className="text-center py-12 text-zinc-500">Loading...</div>
                    ) : (
                        <div className="space-y-6">
                            {DEFAULT_KEYS.map((item) => {
                                const existing = contents.find(c => c.key === item.key);
                                const currentValue = editedValues[item.key] ?? existing?.content ?? item.default;

                                return (
                                    <div key={item.key} className="bg-zinc-900 border border-white/5 rounded-xl p-6">
                                        <label className="block text-sm font-bold text-zinc-400 mb-2">{item.label}</label>
                                        <div className="flex gap-4">
                                            <textarea
                                                value={currentValue}
                                                onChange={(e) => setEditedValues({ ...editedValues, [item.key]: e.target.value })}
                                                rows={2}
                                                className="flex-1 bg-black border border-white/10 rounded p-3 text-white resize-none focus:border-brand-green outline-none"
                                                placeholder={item.default || 'Empty'}
                                            />
                                            <button
                                                onClick={() => handleSave(item.key)}
                                                disabled={saving === item.key}
                                                className="px-4 py-2 bg-brand-green text-black font-bold rounded hover:bg-white transition-colors disabled:opacity-50 h-fit"
                                            >
                                                {saving === item.key ? '...' : 'Save'}
                                            </button>
                                        </div>
                                        <p className="text-xs text-zinc-600 mt-2">Key: {item.key}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
