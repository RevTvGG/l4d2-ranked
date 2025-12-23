"use client";

import { joinTeam } from "@/app/actions/team";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";

interface Props {
    teamId: string;
    teamName: string;
    members: { steamId: string | null }[];
}

export function JoinTeamButton({ teamId, teamName, members }: Props) {
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // @ts-expect-error - custom field
    const userSteamId = session?.user?.steamId;

    // Logic to hide button
    if (!userSteamId) return null; // Not logged in

    const isMember = members.some(m => m.steamId === userSteamId);
    if (isMember) return null; // Already in this team

    // Note: We can't easily check if they are in ANOTHER team on client without extra data.
    // The server action handles that validation.

    async function handleJoin() {
        if (!confirm(`Join team "${teamName}"?`)) return;

        setLoading(true);
        const res = await joinTeam(userSteamId, teamId);

        if (res.success) {
            router.refresh();
        } else {
            alert(res.message);
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleJoin}
            disabled={loading}
            className="bg-brand-green text-black font-black uppercase px-6 py-2 rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-brand-green/20"
        >
            {loading ? "Joining..." : "1 CLICK JOIN"}
        </button>
    );
}
