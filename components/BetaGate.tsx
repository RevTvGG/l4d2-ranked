"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

// Routes that don't require beta access (public pages)
const PUBLIC_ROUTES = [
    "/",
    "/faq",
    "/leaderboard",
    "/bans",
    "/beta/verify",
    "/api",
];

// Check if a path is public (some paths depend on who's viewing)
function isPublicRoute(pathname: string, username?: string | null): boolean {
    // Profile pages: public EXCEPT viewing your own profile
    if (pathname.startsWith("/profile/")) {
        const viewingProfile = pathname.split("/")[2]; // /profile/[username]
        // If viewing someone else's profile, it's public
        // If viewing your own profile, requires beta
        if (username && viewingProfile === username) {
            return false; // Own profile = protected
        }
        return true; // Other profiles = public
    }

    return PUBLIC_ROUTES.some(route =>
        pathname === route || pathname.startsWith(route + "/")
    );
}

interface BetaGateProps {
    children: React.ReactNode;
}

export function BetaGate({ children }: BetaGateProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    // Track verification states
    const [isVerified, setIsVerified] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Get current user's username
    const currentUsername = session?.user?.name;

    // Determine if we need to check (authenticated + protected route)
    const needsCheck = status === "authenticated" && !isPublicRoute(pathname, currentUsername);

    useEffect(() => {
        // Reset verification states when pathname changes
        setIsVerified(false);
        setIsRedirecting(false);
    }, [pathname]);

    useEffect(() => {
        // Skip check for public routes
        if (isPublicRoute(pathname, currentUsername)) {
            setIsVerified(true);
            return;
        }

        // Skip for unauthenticated users (they'll be redirected by auth)
        if (status === "unauthenticated") {
            setIsVerified(true);
            return;
        }

        // Wait for session to load
        if (status === "loading") {
            return;
        }

        // Already verified - no need to check again
        if (isVerified) {
            return;
        }

        // User is authenticated on protected route - check beta access
        if (session?.user && !isRedirecting) {
            const checkAccess = async () => {
                try {
                    const res = await fetch("/api/auth/beta-check");
                    const data = await res.json();

                    if (!data.hasAccess) {
                        setIsRedirecting(true);
                        router.replace("/beta/verify");
                    } else {
                        setIsVerified(true);
                    }
                } catch {
                    // If check fails, allow access to prevent lockout
                    setIsVerified(true);
                }
            };
            checkAccess();
        }
    }, [status, session, pathname, router, isVerified, isRedirecting]);

    // ALWAYS show loading for protected routes until verified
    const showLoading = (
        status === "loading" ||
        (needsCheck && !isVerified && !isRedirecting)
    );

    if (showLoading) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-brand-green mx-auto" />
                    <div>
                        <p className="text-white font-bold">L4D2 Ranked</p>
                        <p className="text-zinc-500 text-sm">Verificando acceso...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show redirecting state
    if (isRedirecting) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
                    <div>
                        <p className="text-amber-500 font-bold">Acceso Beta Requerido</p>
                        <p className="text-zinc-500 text-sm">Redirigiendo...</p>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

