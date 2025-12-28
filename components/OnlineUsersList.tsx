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

    return (
        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-xl text-green-500">●</span> Online Players <span className="text-zinc-500 text-xs ml-auto font-normal">{users.length} Active</span>
            </h3>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                {users.map((user, i) => (
                    <Link
                        key={i}
                        href={`/profile/${user.name}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all group"
                    >
                        <div className="relative shrink-0">
                            <div className={`h-8 w-8 rounded-full overflow-hidden border ${user.isPremium ? 'border-amber-400' : 'border-zinc-700'} group-hover:border-white/50 transition-colors`}>
                                {user.image ? (
                                    <Image
                                        src={user.image}
                                        alt={user.name || "User"}
                                        width={32}
                                        height={32}
                                        className="object-cover w-full h-full"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-sm font-bold">
                                        {user.name?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}
                            </div>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-zinc-900 rounded-full"></span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className={`font-medium text-sm truncate ${user.isPremium ? 'text-amber-200' : 'text-zinc-300'} group-hover:text-white`}>
                                {user.name}
                            </div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                                {user.isPremium ? "Premium" : "Online"}
                            </div>
                        </div>
                    </Link>
                ))}

                {users.length === 0 && (
                    <div className="text-zinc-500 text-sm italic text-center py-4">
                        No active players...
                    </div>
                )}
            </div>
        </div>
    );
}
