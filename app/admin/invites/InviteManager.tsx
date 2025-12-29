"use client";

import { useState, useEffect, useTransition } from "react";
import { createInviteCodes, getInviteCodes, deleteInviteCode } from "@/app/actions/invite";
import { Copy, Trash2, Loader2, Plus, CheckCircle, Clock } from "lucide-react";
import Image from "next/image";

type InviteCode = {
    id: string;
    code: string;
    isUsed: boolean;
    usedAt: Date | null;
    createdAt: Date;
    user: { id: string; name: string | null; image: string | null; steamId: string | null } | null;
    creator: { name: string | null } | null;
};

export function InviteManager() {
    const [invites, setInvites] = useState<InviteCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [generateCount, setGenerateCount] = useState(5);

    const fetchInvites = async () => {
        const result = await getInviteCodes();
        if (result.invites) {
            setInvites(result.invites as InviteCode[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchInvites();
    }, []);

    const handleGenerate = () => {
        startTransition(async () => {
            await createInviteCodes(generateCount);
            fetchInvites();
        });
    };

    const handleDelete = (id: string) => {
        startTransition(async () => {
            await deleteInviteCode(id);
            fetchInvites();
        });
    };

    const handleCopy = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const usedCount = invites.filter(i => i.isUsed).length;
    const availableCount = invites.length - usedCount;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 text-center">
                    <div className="text-4xl font-black text-brand-green">{availableCount}</div>
                    <div className="text-zinc-500 text-sm uppercase tracking-wider">Available</div>
                </div>
                <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 text-center">
                    <div className="text-4xl font-black text-blue-400">{usedCount}</div>
                    <div className="text-zinc-500 text-sm uppercase tracking-wider">Used</div>
                </div>
                <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 text-center">
                    <div className="text-4xl font-black text-white">{invites.length}</div>
                    <div className="text-zinc-500 text-sm uppercase tracking-wider">Total</div>
                </div>
            </div>

            {/* Generate Codes */}
            <div className="bg-zinc-900 border border-white/5 rounded-xl p-6">
                <h2 className="text-lg font-bold uppercase mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-brand-green" />
                    Generate New Codes
                </h2>
                <div className="flex gap-4 items-center">
                    <select
                        value={generateCount}
                        onChange={(e) => setGenerateCount(Number(e.target.value))}
                        className="bg-black border border-white/10 rounded-lg px-4 py-2 text-white"
                    >
                        <option value={1}>1 Code</option>
                        <option value={5}>5 Codes</option>
                        <option value={10}>10 Codes</option>
                        <option value={25}>25 Codes</option>
                    </select>
                    <button
                        onClick={handleGenerate}
                        disabled={isPending}
                        className="bg-brand-green hover:bg-brand-green/90 disabled:bg-zinc-700 text-black font-bold px-6 py-2 rounded-lg transition-all flex items-center gap-2"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Generate
                    </button>
                </div>
            </div>

            {/* Codes Table */}
            <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/5">
                    <h2 className="text-lg font-bold uppercase">All Codes</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-black/50">
                            <tr className="text-left text-zinc-500 text-xs uppercase tracking-wider">
                                <th className="p-4">Code</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Used By</th>
                                <th className="p-4">Created</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invites.map((invite) => (
                                <tr key={invite.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <code className="font-mono text-brand-green bg-brand-green/10 px-2 py-1 rounded">
                                            {invite.code}
                                        </code>
                                    </td>
                                    <td className="p-4">
                                        {invite.isUsed ? (
                                            <span className="inline-flex items-center gap-1 text-blue-400 text-sm">
                                                <CheckCircle className="w-4 h-4" /> Used
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-brand-green text-sm">
                                                <Clock className="w-4 h-4" /> Available
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {invite.user ? (
                                            <div className="flex items-center gap-2">
                                                <Image
                                                    src={invite.user.image || "/default_avatar.jpg"}
                                                    alt=""
                                                    width={24}
                                                    height={24}
                                                    className="rounded-full"
                                                />
                                                <span className="text-sm">{invite.user.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-zinc-600">—</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-zinc-500 text-sm">
                                        {new Date(invite.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleCopy(invite.code, invite.id)}
                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
                                                title="Copy Code"
                                            >
                                                {copiedId === invite.id ? (
                                                    <CheckCircle className="w-4 h-4 text-brand-green" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </button>
                                            {!invite.isUsed && (
                                                <button
                                                    onClick={() => handleDelete(invite.id)}
                                                    disabled={isPending}
                                                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-zinc-400 hover:text-red-400"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {invites.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-zinc-500">
                                        No invite codes yet. Generate some above!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
