import { PlayerProfile } from "@/components/PlayerProfile";
import { getProfile } from "@/app/actions/getProfile";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ReportButton from "@/components/ReportButton";
import ProfileBackground from "@/components/ProfileBackground";
import { getThemeColors } from "@/lib/themes";

type Props = {
    params: Promise<{ username: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ params }: Props) {
    const { username } = await params;

    const profileData = await getProfile(username);
    const session = await getServerSession(authOptions);

    // Check if viewing own profile
    // @ts-expect-error - steamId is custom field
    const isOwner = session?.user?.steamId === profileData?.steamId;

    if (!profileData) {
        // If user not found in DB
        return (
            <div className="min-h-screen bg-black pt-32 pb-16 px-4">
                <div className="container mx-auto text-center text-white">
                    <h1 className="text-4xl font-bold mb-4">Player Not Found</h1>
                    <p className="text-zinc-500">The player &quot;{decodeURIComponent(username)}&quot; has not registered yet.</p>
                </div>
            </div>
        )
    }

    // Get theme colors for premium background
    const themeColors = getThemeColors(profileData.profileTheme === "DEFAULT" ? "emerald" : profileData.profileTheme);

    return (
        <div className="min-h-screen bg-black pt-32 pb-16 px-4 relative">
            {/* Premium animated background */}
            <ProfileBackground
                isPremium={profileData.isPremium || false}
                profileWallpaper={profileData.profileWallpaper}
                themeColors={themeColors}
            />

            <div className="container mx-auto relative z-10">
                <PlayerProfile {...profileData} isOwner={isOwner} />

                {/* Report Button - Only visible when viewing other profiles */}
                {!isOwner && session && profileData.userId && (
                    <div className="max-w-6xl mx-auto mt-6 flex justify-end">
                        <ReportButton
                            reportedUserId={profileData.userId}
                            reportedUserName={profileData.username}
                        />
                    </div>
                )}

                <div className="mt-12 text-center text-zinc-600 text-xs">
                    Values are live from the Ranked Database.
                </div>
            </div>
        </div>
    );
}
