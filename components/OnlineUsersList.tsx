'use client'

import { useState, useEffect } from 'react'
import { getOnlineUsers } from '@/app/actions/chat'
import Image from 'next/image'
import Link from 'next/link'

type SimpleUser = {
    name: string | null
    image: string | null
    isPremium: boolean
}

export default function OnlineUsersList() {
    const [users, setUsers] = useState<SimpleUser[]>([])

    useEffect(() => {
        const fetchUsers = async () => {
            const data = await getOnlineUsers();
            setUsers(data);
        }

        fetchUsers();
        // Refresh every 30 seconds
        const interval = setInterval(fetchUsers, 30000);
        return () => clearInterval(interval);
    }, []);

    // Filter to show only online users (getOnlineUsers already does this, but good to be explicit)
    const onlineUsers = users.filter(u => u.name); // Only show users with names (online)

    return (
        <div className="relative bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-black/95 border-2 border-brand-green/40 p-6 rounded-3xl backdrop-blur-xl shadow-[0_20px_80px_-20px_rgba(74,222,128,0.5),0_0_40px_-10px_rgba(74,222,128,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] hover:border-brand-green/80 hover:shadow-[0_30px_100px_-20px_rgba(74,222,128,0.7),0_0_60px_-10px_rgba(74,222,128,0.5)] transition-all duration-700 overflow-hidden group">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-green/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

            {/* Multiple animated scan lines */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-brand-green/60 to-transparent animate-scan-line shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent animate-scan-line" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Premium corner frame */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-green/60 rounded-tl-2xl"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-green/60 rounded-tr-2xl"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-green/60 rounded-bl-2xl"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-green/60 rounded-br-2xl"></div>

            {/* Inner glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-brand-green/20 to-transparent blur-3xl"></div>

            <h3 className="font-black text-white mb-6 flex items-center gap-3 uppercase tracking-wider text-base relative z-10 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-green"></span>
                </span>
                <span className="bg-gradient-to-r from-white via-brand-green to-white bg-clip-text text-transparent animate-text-shimmer">ONLINE PLAYERS</span>
                <span className="text-brand-green text-sm ml-auto font-mono">{onlineUsers.length}</span>
            </h3>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-brand-green/30 scrollbar-track-transparent relative z-10">
                {onlineUsers.map((user, i) => (
                    <Link
                        key={i}
                        href={`/profile/${user.name}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/50 hover:bg-zinc-900/70 border border-white/5 hover:border-brand-green/30 transition-all group/item hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(74,222,128,0.2)]"
                    >
                        <div className="relative shrink-0">
                            <div className={`h-10 w-10 rounded-xl overflow-hidden border-2 ${user.isPremium ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'border-brand-green/50'} group-hover/item:border-brand-green transition-all`}>
                                {user.image ? (
                                    <Image
                                        src={user.image}
                                        alt={user.name || "User"}
                                        width={40}
                                        height={40}
                                        className="object-cover w-full h-full"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-sm font-bold">
                                        {user.name?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}
                            </div>
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-green border-2 border-zinc-950 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse"></span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className={`font-bold text-sm truncate ${user.isPremium ? 'text-amber-300' : 'text-white'} group-hover/item:text-brand-green transition-colors`}>
                                {user.name}
                            </div>
                            <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-bold">
                                {user.isPremium ? "👑 Premium" : "Online"}
                            </div>
                        </div>
                    </Link>
                ))}

                {onlineUsers.length === 0 && (
                    <div className="text-zinc-500 text-sm italic text-center py-8 relative z-10">
                        No players online...
                    </div>
                )}
            </div>
        </div>
    );
}
