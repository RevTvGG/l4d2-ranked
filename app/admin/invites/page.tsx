import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InviteManager } from "./InviteManager";

export default async function AdminInvitesPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        redirect("/");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
        redirect("/admin");
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-black uppercase tracking-tight mb-2">
                        🎟️ Invite <span className="text-brand-green">Codes</span>
                    </h1>
                    <p className="text-zinc-500">
                        Generate and manage beta access codes.
                    </p>
                </div>

                <InviteManager />
            </div>
        </div>
    );
}
