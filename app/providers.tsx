"use client";

import { SessionProvider } from "next-auth/react";
import DisclaimerModal from "@/components/DisclaimerModal";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <DisclaimerModal />
            {children}
        </SessionProvider>
    );
}
