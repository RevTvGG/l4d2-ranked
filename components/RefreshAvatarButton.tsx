'use client'

import { useState } from "react";
import { refreshAvatar } from "@/app/actions/avatar";
import { useRouter } from "next/navigation";

export function RefreshAvatarButton() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();

    async function handleRefresh() {
        setLoading(true);
        setMessage("");

        const result = await refreshAvatar();

        if (result.success) {
            setMessage("✓");
            router.refresh();
            setTimeout(() => setMessage(""), 2000);
        } else {
            setMessage("✗");
            setTimeout(() => setMessage(""), 2000);
        }

        setLoading(false);
    }

    return (
        <button
            onClick={handleRefresh}
            disabled={loading}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-black/50 border border-white/10 text-zinc-400 hover:text-white hover:bg-black/80 transition-all backdrop-blur-md disabled:opacity-50"
            title="Refresh Avatar from Steam"
        >
            {loading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : message ? (
                <span className={message === "✓" ? "text-brand-green" : "text-red-500"}>{message}</span>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z" />
                    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
                </svg>
            )}
        </button>
    );
}
