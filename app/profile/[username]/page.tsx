import { PlayerProfile } from "@/components/PlayerProfile";
import { Navbar } from "@/components/Navbar";
import { getProfile } from "@/app/actions/getProfile";
import { notFound } from "next/navigation";

type Props = {
    params: Promise<{ username: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ProfilePage({ params }: Props) {
    const { username } = await params;

    const profileData = await getProfile(username);

    if (!profileData) {
        // If user not found in DB
        return (
            <div className="min-h-screen bg-black pt-32 pb-16 px-4">
                <Navbar />
                <div className="container mx-auto text-center text-white">
                    <h1 className="text-4xl font-bold mb-4">Player Not Found</h1>
                    <p className="text-zinc-500">The player &quot;{decodeURIComponent(username)}&quot; has not registered yet.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black pt-32 pb-16 px-4">
            <Navbar />
            <div className="container mx-auto">
                <PlayerProfile {...profileData} />

                <div className="mt-12 text-center text-zinc-600 text-xs">
                    Values are live from the Ranked Database.
                </div>
            </div>
        </div>
    );
}
