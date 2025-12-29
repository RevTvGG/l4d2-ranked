'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';

const OWNER_ROLE = 'OWNER';

const RARITY_COLORS = {
    COMMON: { border: 'border-gray-500', glow: 'shadow-gray-500/20', bg: 'bg-gray-500/10' },
    RARE: { border: 'border-blue-500', glow: 'shadow-blue-500/30', bg: 'bg-blue-500/10' },
    EPIC: { border: 'border-purple-500', glow: 'shadow-purple-500/40', bg: 'bg-purple-500/10' },
    LEGENDARY: { border: 'border-yellow-500', glow: 'shadow-yellow-500/50', bg: 'bg-yellow-500/10' },
};

interface Medal {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    createdAt: string;
    _count?: { awards: number };
}

export default function AdminMedalsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [medals, setMedals] = useState<Medal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingMedal, setEditingMedal] = useState<Medal | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: '🏆',
        color: '#22c55e',
        rarity: 'COMMON' as Medal['rarity']
    });

    // @ts-expect-error - role is custom
    const userRole = session?.user?.role;
    const isOwner = userRole === OWNER_ROLE;

    useEffect(() => {
        if (status === 'authenticated' && !isOwner) {
            router.push('/');
        }
    }, [status, isOwner, router]);

    useEffect(() => {
        if (isOwner) {
            fetchMedals();
        }
    }, [isOwner]);

    const fetchMedals = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/medals');
            const data = await res.json();
            if (data.success) {
                setMedals(data.medals);
            }
        } catch (error) {
            console.error('Failed to fetch medals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingMedal
                ? `/api/admin/medals/${editingMedal.id}`
                : '/api/admin/medals';

            const method = editingMedal ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.success) {
                await fetchMedals();
                resetForm();
                setShowForm(false);
            } else {
                alert(data.error || 'Failed to save medal');
            }
        } catch (error) {
            console.error('Failed to save medal:', error);
            alert('Failed to save medal');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this medal? This will also remove it from all users.')) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/medals/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                await fetchMedals();
            } else {
                alert(data.error || 'Failed to delete medal');
            }
        } catch (error) {
            console.error('Failed to delete medal:', error);
            alert('Failed to delete medal');
        }
    };

    const handleEdit = (medal: Medal) => {
        setEditingMedal(medal);
        setFormData({
            name: medal.name,
            description: medal.description,
            icon: medal.icon,
            color: medal.color,
            rarity: medal.rarity
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            icon: '🏆',
            color: '#22c55e',
            rarity: 'COMMON'
        });
        setEditingMedal(null);
    };

    if (status === 'loading' || !isOwner) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
    }

    const rarityStyle = RARITY_COLORS[formData.rarity];

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="pt-24 pb-16 px-6">
                <div className="container mx-auto max-w-6xl">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <Link href="/admin" className="text-brand-green hover:underline text-sm mb-2 block">
                                ← Back to Admin
                            </Link>
                            <h1 className="text-4xl font-black uppercase tracking-tight">
                                🏅 Medal Manager
                            </h1>
                            <p className="text-zinc-500 mt-2">Create and manage custom medals</p>
                        </div>
                        <button
                            onClick={() => {
                                resetForm();
                                setShowForm(true);
                            }}
                            className="h-12 px-6 bg-brand-green text-black rounded-lg font-bold hover:bg-lime-400 transition-colors"
                        >
                            + New Medal
                        </button>
                    </div>

                    {/* Form Modal */}
                    {showForm && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                <h2 className="text-2xl font-bold mb-6">
                                    {editingMedal ? 'Edit Medal' : 'Create New Medal'}
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Live Preview */}
                                    <div className={`p-6 rounded-xl border-2 ${rarityStyle.border} ${rarityStyle.bg} ${rarityStyle.glow} transition-all`}>
                                        <div className="flex items-center gap-4">
                                            <div className="text-6xl">{formData.icon}</div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold" style={{ color: formData.color }}>
                                                    {formData.name || 'Medal Name'}
                                                </h3>
                                                <p className="text-sm text-zinc-400 mt-1">
                                                    {formData.description || 'Medal description'}
                                                </p>
                                                <span className="inline-block mt-2 text-xs uppercase tracking-wider px-2 py-1 rounded bg-white/10">
                                                    {formData.rarity}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium mb-2">Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-2 text-white"
                                                required
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium mb-2">Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-2 text-white h-24"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Icon (Emoji)</label>
                                            <input
                                                type="text"
                                                value={formData.icon}
                                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-2 text-white text-center text-4xl"
                                                maxLength={2}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Color</label>
                                            <input
                                                type="color"
                                                value={formData.color}
                                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                className="w-full bg-zinc-800 border border-white/10 rounded-lg h-12"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium mb-2">Rarity</label>
                                            <select
                                                value={formData.rarity}
                                                onChange={(e) => setFormData({ ...formData, rarity: e.target.value as Medal['rarity'] })}
                                                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-2 text-white"
                                            >
                                                <option value="COMMON">Common</option>
                                                <option value="RARE">Rare</option>
                                                <option value="EPIC">Epic</option>
                                                <option value="LEGENDARY">Legendary</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowForm(false);
                                                resetForm();
                                            }}
                                            className="px-6 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-brand-green text-black rounded-lg font-bold hover:bg-lime-400 transition-colors"
                                        >
                                            {editingMedal ? 'Update' : 'Create'} Medal
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Medals List */}
                    {loading ? (
                        <div className="text-center text-zinc-500 py-12">Loading medals...</div>
                    ) : medals.length === 0 ? (
                        <div className="text-center text-zinc-500 py-12">
                            No medals yet. Create your first medal!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {medals.map((medal) => {
                                const style = RARITY_COLORS[medal.rarity];
                                return (
                                    <div
                                        key={medal.id}
                                        className={`p-6 rounded-xl border-2 ${style.border} ${style.bg} ${style.glow} transition-all hover:scale-105`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="text-5xl">{medal.icon}</div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(medal)}
                                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(medal.id)}
                                                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold mb-1" style={{ color: medal.color }}>
                                            {medal.name}
                                        </h3>
                                        <p className="text-sm text-zinc-400 mb-3">{medal.description}</p>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="uppercase tracking-wider px-2 py-1 rounded bg-white/10">
                                                {medal.rarity}
                                            </span>
                                            {medal._count && (
                                                <span className="text-zinc-500">
                                                    {medal._count.awards} awarded
                                                </span>
                                            )}
                                        </div>
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
