"use client";

import Link from "next/link";
import Image from "next/image";
import { AuthButton } from "./AuthButton";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const ADMIN_ROLES = ['OWNER', 'ADMIN', 'MODERATOR'];

// Navigation links configuration
const NAV_LINKS = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { href: '/teams', label: 'Teams', icon: '👥' },
    { href: '/bans', label: 'Bans', icon: '🚫' },
    { href: '/play', label: 'Matchmaking', icon: '⚔️', highlight: true },
    { href: '/faq', label: 'FAQ', icon: '❓' },
];

export function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Profile URL
    const profileUrl = session?.user
        ? `/profile/${session.user.steamId}`
        : "/profile/demo";

    // Check if user has admin role
    const isAdmin = session?.user?.role && ADMIN_ROLES.includes(session.user.role);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Check if link is active
    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <>
            <header
                className={`fixed w-full top-0 z-50 transition-all duration-500 ${scrolled
                        ? 'bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/50'
                        : 'bg-gradient-to-b from-black/90 via-black/50 to-transparent backdrop-blur-md'
                    }`}
            >
                {/* Animated top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-green to-transparent opacity-60" />

                <div className={`container mx-auto px-6 flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-16' : 'h-20'
                    }`}>

                    {/* LOGO - Animated with glow */}
                    <Link href="/" className="flex items-center gap-2 group relative">
                        {/* Glow effect behind logo */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-brand-green/20 via-emerald-500/10 to-brand-green/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Logo icon */}
                        <div className="relative w-10 h-10 flex items-center justify-center">
                            <div className="absolute inset-0 bg-brand-green/20 rounded-lg animate-pulse" />
                            <span className="text-2xl">🎮</span>
                        </div>

                        {/* Logo text */}
                        <div className="relative flex items-baseline gap-0.5">
                            <span className="text-2xl md:text-3xl font-black italic tracking-tighter text-white transition-all group-hover:text-zinc-100">
                                L4D2
                            </span>
                            <span className="text-2xl md:text-3xl font-black italic tracking-tighter text-brand-green drop-shadow-[0_0_15px_rgba(74,222,128,0.6)] transition-all group-hover:drop-shadow-[0_0_25px_rgba(74,222,128,0.8)] animate-pulse">
                                RANKED
                            </span>
                        </div>
                    </Link>

                    {/* DESKTOP NAV */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 group ${isActive(link.href)
                                        ? link.highlight
                                            ? 'text-black bg-brand-green shadow-lg shadow-brand-green/30'
                                            : 'text-white bg-white/10'
                                        : link.highlight
                                            ? 'text-brand-green hover:text-black hover:bg-brand-green hover:shadow-lg hover:shadow-brand-green/30'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {/* Hover glow effect */}
                                <span className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${link.highlight ? 'bg-brand-green/10' : 'bg-white/5'
                                    }`} />

                                {/* Active indicator dot */}
                                {isActive(link.href) && !link.highlight && (
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-green rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                                )}

                                <span className="relative flex items-center gap-1.5">
                                    {link.highlight && <span className="text-xs">{link.icon}</span>}
                                    <span className={link.highlight ? 'font-bold uppercase tracking-wide text-xs' : ''}>
                                        {link.label}
                                    </span>
                                </span>
                            </Link>
                        ))}

                        {/* Separator */}
                        <div className="w-px h-6 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-2" />

                        {/* Premium Link - Special styling */}
                        <Link
                            href="/premium"
                            className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 group overflow-hidden ${isActive('/premium')
                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/30'
                                    : 'text-amber-400 hover:text-black'
                                }`}
                        >
                            {/* Animated gradient background on hover */}
                            <span className={`absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 bg-[length:200%_100%] transition-all duration-300 ${isActive('/premium') ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                } animate-gradient-x`} />

                            <span className="relative flex items-center gap-1">
                                <span className="animate-bounce">👑</span>
                                <span>PREMIUM</span>
                            </span>
                        </Link>

                        {/* Profile Link */}
                        <Link
                            href={profileUrl}
                            className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${isActive('/profile')
                                    ? 'text-white bg-white/10'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Profile
                            {isActive('/profile') && (
                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-green rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                            )}
                        </Link>

                        {/* Admin Link - Special styling */}
                        {isAdmin && (
                            <Link
                                href="/admin"
                                className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${isActive('/admin')
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : 'text-red-500 hover:bg-red-500/10 hover:text-red-400'
                                    }`}
                            >
                                <span className="flex items-center gap-1">
                                    <span>🛡️</span>
                                    <span>Admin</span>
                                </span>
                            </Link>
                        )}
                    </nav>

                    {/* RIGHT SIDE - Auth + Mobile Menu */}
                    <div className="flex items-center gap-4">
                        {/* Auth Button (Desktop) */}
                        <div className="hidden lg:block">
                            <AuthButton />
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                            aria-label="Toggle menu"
                        >
                            <div className="flex flex-col gap-1.5 w-5">
                                <span className={`block h-0.5 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                                    }`} />
                                <span className={`block h-0.5 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 scale-0' : ''
                                    }`} />
                                <span className={`block h-0.5 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                                    }`} />
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            {/* MOBILE MENU OVERLAY */}
            <div
                className={`fixed inset-0 z-40 lg:hidden transition-all duration-500 ${mobileMenuOpen
                        ? 'opacity-100 pointer-events-auto'
                        : 'opacity-0 pointer-events-none'
                    }`}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    onClick={() => setMobileMenuOpen(false)}
                />

                {/* Menu Panel */}
                <div className={`absolute top-20 left-4 right-4 bg-zinc-900/95 border border-white/10 rounded-2xl p-6 shadow-2xl transition-all duration-500 ${mobileMenuOpen
                        ? 'translate-y-0 opacity-100'
                        : '-translate-y-8 opacity-0'
                    }`}>
                    {/* Mobile Nav Links */}
                    <nav className="flex flex-col gap-2 mb-6">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${isActive(link.href)
                                        ? link.highlight
                                            ? 'text-black bg-brand-green'
                                            : 'text-white bg-white/10'
                                        : link.highlight
                                            ? 'text-brand-green border border-brand-green/30'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <span className="text-lg">{link.icon}</span>
                                <span className={link.highlight ? 'font-bold uppercase' : ''}>{link.label}</span>
                                {isActive(link.href) && (
                                    <span className="ml-auto w-2 h-2 bg-brand-green rounded-full animate-pulse" />
                                )}
                            </Link>
                        ))}

                        {/* Premium Mobile */}
                        <Link
                            href="/premium"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold transition-all ${isActive('/premium')
                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black'
                                    : 'text-amber-400 border border-amber-500/30'
                                }`}
                        >
                            <span className="text-lg animate-bounce">👑</span>
                            <span>PREMIUM</span>
                        </Link>

                        {/* Profile Mobile */}
                        <Link
                            href={profileUrl}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${isActive('/profile')
                                    ? 'text-white bg-white/10'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span className="text-lg">👤</span>
                            <span>Profile</span>
                        </Link>

                        {/* Admin Mobile */}
                        {isAdmin && (
                            <Link
                                href="/admin"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold transition-all ${isActive('/admin')
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : 'text-red-500 border border-red-500/30'
                                    }`}
                            >
                                <span className="text-lg">🛡️</span>
                                <span>Admin Panel</span>
                            </Link>
                        )}
                    </nav>

                    {/* Separator */}
                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

                    {/* Auth Button Mobile */}
                    <div className="flex justify-center">
                        <AuthButton />
                    </div>
                </div>
            </div>

            {/* Spacer to prevent content from going under fixed navbar */}
            <div className={`transition-all duration-300 ${scrolled ? 'h-16' : 'h-20'}`} />
        </>
    );
}
