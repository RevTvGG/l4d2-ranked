"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export function AuthButton() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return <div className="h-9 w-24 bg-white/5 animate-pulse rounded-full"></div>;
    }

    if (session && session.user) {
        return (
            <div className="flex items-center gap-3">
                {/* User Dropdown / Info */}
                <div className="hidden md:block text-right">
                    <div className="text-xs text-zinc-400">Welcome,</div>
                    <div className="text-sm font-bold text-white leading-none">{session.user.name}</div>
                </div>

                {/* @ts-expect-error - steamId comes from our custom jwt callback */}
                <Link href={`/profile/${session.user.steamId}`} className="relative h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                    <Image
                        src={session.user.image || "/default_avatar.jpg"}
                        alt="User Avatar"
                        fill
                        className="rounded-full border-2 border-brand-green bg-zinc-800 object-cover"
                    />
                </Link>

                <button
                    onClick={() => signOut()}
                    className="text-xs text-zinc-500 hover:text-white underline"
                >
                    Log out
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => signIn("steam")}
            className="flex items-center gap-2 bg-[#171a21] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[#2a475e] transition-colors border border-white/10"
        >
            <svg className="w-5 h-5 mx-auto fill-current" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12c0 3.174 1.232 6.059 3.238 8.188l-.022-.016c.143.111.411.238.441.25.044.017.203.076.255.087.052.011.666.216.711.23.045.012.378.106.417.116.038.009.61.139.67.149.06.012.569.117.653.136.082.018.423.076.541.096.117.021.579.088.665.1.087.012.637.085.733.093s.59.066.829.089c1.926.195 4.665-.246 6.095-2.585.59-1.077 1.054-2.535 1.054-4.223 0-1.085-.195-2.091-.531-3.004l-2.092 3.036c.036.211.07.424.07.643 0 2.238-1.745 4.053-3.899 4.053-2.152 0-3.898-1.815-3.898-4.053 0-2.237 1.746-4.052 3.898-4.052 1.011 0 1.93.385 2.617 1.014L23.974 5.48a12.01 12.01 0 0 0-11.974-5.48zm-2.887 13.924c-1.127 0-2.041-.951-2.041-2.124 0-1.171.914-2.124 2.041-2.124 1.127 0 2.041.953 2.041 2.124 0 1.173-.914 2.124-2.041 2.124zm2.842-7.234c.783 0 1.418.661 1.418 1.477s-.635 1.478-1.418 1.478c-.783 0-1.418-.662-1.418-1.478s.635-1.477 1.418-1.477z" /></svg>
            Sign in with Steam
        </button>
    );
}
