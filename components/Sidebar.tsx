"use client";

import Link from "next/link";
import Image from "next/image";
import { AuthButton } from "./AuthButton";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

const ADMIN_ROLES = ['OWNER', 'ADMIN', 'MODERATOR'];

// Navigation links configuration
const NAV_LINKS = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { href: '/teams', label: 'Teams', icon: '👥' },
    { href: '/bans', label: 'Bans', icon: '🚫' },
    { href: '/faq', label: 'FAQ', icon: '❓' },
];

export function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [isExpanded, setIsExpanded] = useState(false);

    // Profile URL
    const profileUrl = session?.user
        ? `/profile/${session.user.steamId}`
        : "/profile/demo";

    // Check if user has admin role
    const isAdmin = session?.user?.role && ADMIN_ROLES.includes(session.user.role);

    // Check if link is active
    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* DESKTOP SIDEBAR */}
            <aside
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
                className={`fixed left-0 top-0 h-screen z-50 hidden lg:flex flex-col
                    bg-black/60 backdrop-blur-2xl border-r border-white/10
                    transition-all duration-300 ease-out
                    ${isExpanded ? 'w-60' : 'w-[72px]'}
                `}
            >
                {/* Accent gradient line */}
                <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-gradient-to-b from-brand-green/50 via-transparent to-brand-green/50" />

                {/* LOGO */}
                <Link href="/" className="flex items-center gap-3 p-4 border-b border-white/5">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand-green/20 border border-brand-green/30">
                        <span className="text-xl">🎮</span>
                    </div>
                    <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                        <span className="text-lg font-black italic text-white whitespace-nowrap">L4D2</span>
                        <span className="text-sm font-black italic text-brand-green whitespace-nowrap -mt-1">RANKED</span>
                    </div>
                </Link>

                {/* NAV LINKS */}
                <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto">
                    {/* Play Button - Featured */}
                    <Link
                        href="/play"
                        className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                            ${isActive('/play')
                                ? 'bg-brand-green text-black shadow-lg shadow-brand-green/30'
                                : 'text-brand-green hover:bg-brand-green/10'
                            }`}
                    >
                        <div className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all
                            ${isActive('/play') ? 'bg-black/20' : 'bg-brand-green/20 group-hover:bg-brand-green/30'}`}>
                            <span className="text-xl">⚔️</span>
                        </div>
                        <span className={`font-bold uppercase text-sm tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                            Play
                        </span>
                        {!isExpanded && (
                            <div className="absolute left-full ml-3 px-3 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/10 shadow-xl">
                                Play
                            </div>
                        )}
                    </Link>

                    <div className="h-px bg-white/5 my-2" />

                    {/* Regular Nav Links */}
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                                ${isActive(link.href)
                                    ? 'bg-white/10 text-white'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <div className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all
                                ${isActive(link.href) ? 'bg-brand-green/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                                <span className="text-xl">{link.icon}</span>
                            </div>
                            <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                                {link.label}
                            </span>
                            {isActive(link.href) && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-green rounded-r-full" />
                            )}
                            {!isExpanded && (
                                <div className="absolute left-full ml-3 px-3 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/10 shadow-xl">
                                    {link.label}
                                </div>
                            )}
                        </Link>
                    ))}

                    <div className="h-px bg-white/5 my-2" />

                    {/* Premium Link */}
                    <Link
                        href="/premium"
                        className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                            ${isActive('/premium')
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black'
                                : 'text-amber-400 hover:bg-amber-500/10'
                            }`}
                    >
                        <div className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all
                            ${isActive('/premium') ? 'bg-black/20' : 'bg-amber-500/20 group-hover:bg-amber-500/30'}`}>
                            <span className="text-xl animate-pulse">👑</span>
                        </div>
                        <span className={`font-bold uppercase text-sm tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                            Premium
                        </span>
                        {!isExpanded && (
                            <div className="absolute left-full ml-3 px-3 py-2 bg-zinc-900 text-amber-400 text-sm font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-amber-500/30 shadow-xl">
                                Premium
                            </div>
                        )}
                    </Link>

                    {/* Profile Link */}
                    <Link
                        href={profileUrl}
                        className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                            ${isActive('/profile')
                                ? 'bg-white/10 text-white'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <div className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all
                            ${isActive('/profile') ? 'bg-brand-green/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                            <span className="text-xl">👤</span>
                        </div>
                        <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                            Profile
                        </span>
                        {!isExpanded && (
                            <div className="absolute left-full ml-3 px-3 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/10 shadow-xl">
                                Profile
                            </div>
                        )}
                    </Link>

                    {/* Admin Link */}
                    {isAdmin && (
                        <Link
                            href="/admin"
                            className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                                ${isActive('/admin')
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'text-red-500 hover:bg-red-500/10'
                                }`}
                        >
                            <div className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all
                                ${isActive('/admin') ? 'bg-red-500/20' : 'bg-red-500/10 group-hover:bg-red-500/20'}`}>
                                <span className="text-xl">🛡️</span>
                            </div>
                            <span className={`text-sm font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                                Admin
                            </span>
                            {!isExpanded && (
                                <div className="absolute left-full ml-3 px-3 py-2 bg-zinc-900 text-red-400 text-sm font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-red-500/30 shadow-xl">
                                    Admin
                                </div>
                            )}
                        </Link>
                    )}
                </nav>

                {/* USER SECTION */}
                <div className="p-3 border-t border-white/5">
                    <div className={`flex items-center gap-3 p-2 rounded-xl bg-white/5 ${isExpanded ? '' : 'justify-center'}`}>
                        {session?.user?.image ? (
                            <Image
                                src={session.user.image}
                                alt="Avatar"
                                width={40}
                                height={40}
                                className="rounded-lg border border-white/10"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                                <span className="text-zinc-400">?</span>
                            </div>
                        )}
                        <div className={`flex-1 overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                            <p className="text-sm font-medium text-white truncate">
                                {session?.user?.name || 'Guest'}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">
                                {session?.user ? 'Online' : 'Not logged in'}
                            </p>
                        </div>
                    </div>
                    <div className={`mt-2 overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0'}`}>
                        <AuthButton />
                    </div>
                </div>
            </aside>

            {/* MOBILE BOTTOM NAV */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-black/80 backdrop-blur-xl border-t border-white/10">
                <div className="flex items-center justify-around py-2 px-1">
                    {/* Home */}
                    <Link href="/" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive('/') ? 'text-brand-green' : 'text-zinc-500'}`}>
                        <span className="text-xl">🏠</span>
                        <span className="text-[10px] font-medium">Home</span>
                    </Link>

                    {/* Leaderboard */}
                    <Link href="/leaderboard" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive('/leaderboard') ? 'text-brand-green' : 'text-zinc-500'}`}>
                        <span className="text-xl">🏆</span>
                        <span className="text-[10px] font-medium">Ranking</span>
                    </Link>

                    {/* Play - Center Featured */}
                    <Link
                        href="/play"
                        className={`relative flex flex-col items-center gap-1 p-3 -mt-6 rounded-2xl transition-all
                            ${isActive('/play')
                                ? 'bg-brand-green text-black shadow-lg shadow-brand-green/40'
                                : 'bg-brand-green/20 text-brand-green border border-brand-green/30'
                            }`}
                    >
                        <span className="text-2xl">⚔️</span>
                        <span className="text-[10px] font-bold uppercase">Play</span>
                    </Link>

                    {/* Profile */}
                    <Link href={profileUrl} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive('/profile') ? 'text-brand-green' : 'text-zinc-500'}`}>
                        <span className="text-xl">👤</span>
                        <span className="text-[10px] font-medium">Profile</span>
                    </Link>

                    {/* More */}
                    <Link href="/faq" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive('/faq') ? 'text-brand-green' : 'text-zinc-500'}`}>
                        <span className="text-xl">⋯</span>
                        <span className="text-[10px] font-medium">More</span>
                    </Link>
                </div>

                {/* Safe area for iOS */}
                <div className="h-[env(safe-area-inset-bottom)]" />
            </nav>

            {/* Spacer for desktop content */}
            <div className="hidden lg:block w-[72px] flex-shrink-0" />

            {/* Spacer for mobile bottom nav */}
            <div className="lg:hidden h-20" />
        </>
    );
}
