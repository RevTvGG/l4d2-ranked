"use client";

import { SessionProvider } from "next-auth/react";
import DisclaimerModal from "@/components/DisclaimerModal";
import GlobalReportButton from "@/components/GlobalReportButton";
import { BetaGate } from "@/components/BetaGate";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <BetaGate>
                <DisclaimerModal />
                <GlobalReportButton />
                {children}
            </BetaGate>
        </SessionProvider>
    );
}
