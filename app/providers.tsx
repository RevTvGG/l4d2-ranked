"use client";

import { SessionProvider } from "next-auth/react";
import DisclaimerModal from "@/components/DisclaimerModal";
import GlobalReportButton from "@/components/GlobalReportButton";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <DisclaimerModal />
            <GlobalReportButton />
            {children}
        </SessionProvider>
    );
}
