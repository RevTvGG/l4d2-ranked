import { CreateTeamForm } from "@/components/CreateTeamForm";

export const dynamic = 'force-dynamic';

export default function CreateTeamPage() {
    return (
        <div className="min-h-screen bg-black pt-32 pb-16 px-4">

            <div className="container mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-4">
                        Register Your Squad
                    </h1>
                    <p className="text-zinc-400 max-w-lg mx-auto">
                        Lead your team to victory. Creating a team grants you the Captain role and listing on the global team leaderboard.
                    </p>
                </div>

                <CreateTeamForm />
            </div>
        </div>
    );
}
