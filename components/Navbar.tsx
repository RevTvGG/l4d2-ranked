"use client";

import Link from "next/link";
import { AuthButton } from "./AuthButton";
import { useSession } from "next-auth/react";

export function Navbar() {
    const { data: session } = useSession();

    // Calculate profile URL: if logged in, go to their profile with steamId. If not, go to demo.
    const profileUrl = session?.user
        // @ts-expect-error - steamId is active
        ? `/profile/${session.user.name}?steamId=${session.user.steamId}`
        : "/profile/demo";

    return (
        <header className="fixed w-full top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <div className="text-xl font-bold tracking-tighter text-white">
                    <Link href="/">
                        L4D2<span className="text-brand-green">RANKED</span>
                    </Link>
                </div>
                <nav className="hidden md:flex gap-6 text-sm font-medium text-zinc-400">
                    <Link href="/" className="hover:text-white transition-colors">Home</Link>
                    <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
                    <Link href="/teams" className="hover:text-white transition-colors">Teams</Link>
                    <Link href="/play" className="text-brand-green hover:text-white transition-colors font-bold uppercase tracking-wide">Matchmaking</Link>
                    <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
                    <Link href="/premium" className="text-yellow-500 hover:text-yellow-400 transition-colors font-bold drop-shadow-sm">PREMIUM 👑</Link>
                    <Link href={profileUrl} className="hover:text-white transition-colors">Profile</Link>
                </nav>
                <div className="flex items-center gap-4">
                    <AuthButton />
                </div>
            </div>
        </header>
    );
}
