"use client";

import { leaveTeam } from "@/app/actions/team";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LeaveTeamButton() {
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleLeave() {
        if (!confirm("Are you sure? If you are the owner, the team will be deleted.")) return;
        // @ts-expect-error - steamId check
        const id = session?.user?.steamId;
        if (!id) return;

        setLoading(true);
        const res = await leaveTeam(id);
        setLoading(false);

        if (res.success) {
            router.push('/teams');
            router.refresh();
        } else {
            alert(res.message);
        }
    }

    if (!session) return null;

    return (
        <button onClick={handleLeave} disabled={loading} className="uppercase font-bold text-xs tracking-widest text-red-500 hover:text-red-400">
            {loading ? "Leaving..." : "Leave Team"}
        </button>
    )
}
