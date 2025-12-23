import { Navbar } from "@/components/Navbar";
import { ProfileEditForm } from "@/components/ProfileEditForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";


export const dynamic = 'force-dynamic';

export default async function EditProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/api/auth/signin");
    }

    // @ts-expect-error - steamId comes from custom session
    const steamId = session.user?.steamId;

    const { prisma } = await import("@/lib/prisma");

    const user = await prisma.user.findUnique({
        where: { steamId }
    });

    return (
        <div className="min-h-screen bg-black pt-32 pb-16 px-4">
            <Navbar />
            <div className="container mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase mb-4">
                        EDIT YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-600">PLAYSTYLE</span>
                    </h1>
                    <p className="text-zinc-500 max-w-lg mx-auto">
                        Customize how others see you. This helps captains know what role fits you best.
                    </p>
                </div>

                <ProfileEditForm user={user} />
            </div>
        </div>
    );
}
