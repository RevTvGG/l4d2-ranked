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

// Check if a path is public
function isPublicRoute(pathname: string): boolean {
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
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // Skip check for public routes or unauthenticated users
        if (isPublicRoute(pathname) || status === "unauthenticated") {
            setChecking(false);
            return;
        }

        // Wait for session to load
        if (status === "loading") {
            return;
        }

        // User is authenticated - check beta access
        if (session?.user) {
            // Fetch beta access status
            const checkAccess = async () => {
                try {
                    const res = await fetch("/api/auth/beta-check");
                    const data = await res.json();

                    if (!data.hasAccess && pathname !== "/beta/verify") {
                        router.replace("/beta/verify");
                    } else {
                        setChecking(false);
                    }
                } catch {
                    // If check fails, allow access to prevent lockout
                    setChecking(false);
                }
            };
            checkAccess();
        }
    }, [status, session, pathname, router]);

    // Show loading state while checking
    if (status === "loading" || (status === "authenticated" && checking && !isPublicRoute(pathname))) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-green mx-auto mb-4" />
                    <p className="text-zinc-500 text-sm">Checking access...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
