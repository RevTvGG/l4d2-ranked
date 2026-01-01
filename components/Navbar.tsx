"use client";

import Link from "next/link";
import Image from "next/image";
import { AuthButton } from "./AuthButton";
import { useSession } from "next-auth/react";

const ADMIN_ROLES = ['OWNER', 'ADMIN', 'MODERATOR'];

export function Navbar() {
    const { data: session } = useSession();

    // Calculate profile URL: if logged in, go to their profile with steamId. If not, go to demo.
    const profileUrl = session?.user
        ? `/profile/${session.user.steamId}`
        : "/profile/demo";

    // Check if user has admin role
    const isAdmin = session?.user?.role && ADMIN_ROLES.includes(session.user.role);

    return (
        <header className="fixed w-full top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
            <div className="container mx-auto px-6 h-24 flex items-center justify-between">
                <div className="text-xl font-bold tracking-tighter text-white">
                    <Link href="/" className="flex items-center gap-1 group">
                        <span className="text-4xl font-black italic tracking-tighter text-white transition-all group-hover:scale-105 group-hover:text-zinc-100">
                            L4D2
                        </span>
                        <span className="text-4xl font-black italic tracking-tighter text-brand-green drop-shadow-[0_0_8px_rgba(74,222,128,0.5)] transition-all group-hover:scale-105 group-hover:brightness-110">
                            RANKED
                        </span>
                    </Link>
                </div>
                <nav className="hidden md:flex gap-6 text-sm font-medium text-zinc-400 items-center">
                    <Link href="/" className="hover:text-white transition-colors">Home</Link>
                    <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
                    <Link href="/teams" className="hover:text-white transition-colors">Teams</Link>
                    <Link href="/bans" className="hover:text-white transition-colors">Bans</Link>
                    <Link href="/play" className="text-brand-green hover:text-white transition-colors font-bold uppercase tracking-wide">Matchmaking</Link>
                    <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
                    <Link href="/premium" className="text-yellow-500 hover:text-yellow-400 transition-colors font-bold drop-shadow-sm">PREMIUM 👑</Link>
                    <Link href={profileUrl} className="hover:text-white transition-colors">Profile</Link>
                    {isAdmin && (
                        <Link href="/admin" className="text-red-500 hover:text-red-400 transition-colors font-bold">🛡️ Admin</Link>
                    )}
                </nav>
                <div className="flex items-center gap-4">
                    <AuthButton />
                </div>
            </div>
        </header>
    );
}
