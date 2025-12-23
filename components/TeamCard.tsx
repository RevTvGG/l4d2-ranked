import Link from "next/link";
import Image from "next/image";

interface TeamCardProps {
    name: string;
    tag: string;
    logoUrl?: string;
    memberCount: number;
    rating: number;
    rank: number;
}

export function TeamCard({ name, tag, logoUrl, memberCount, rating, rank }: TeamCardProps) {
    return (
        <Link href={`/teams/${tag}`} className="group relative block p-6 rounded-2xl bg-zinc-900 border border-white/5 hover:border-brand-green/30 transition-all hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-brand-green/5">
            <div className="flex items-center gap-4 mb-4">
                <div className="relative h-16 w-16 bg-zinc-800 rounded-xl overflow-hidden border border-white/5 group-hover:border-brand-green/50 transition-colors">
                    {logoUrl ? (
                        <Image src={logoUrl} alt={name} fill className="object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-2xl">🛡️</div>
                    )}
                </div>
                <div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Rank #{rank}</div>
                    <h3 className="text-xl font-black text-white italic tracking-tighter group-hover:text-brand-green transition-colors">
                        [{tag}] {name}
                    </h3>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-4">
                <div>
                    <div className="text-xs text-zinc-500 font-bold uppercase">Rating</div>
                    <div className="text-brand-green font-mono font-bold">{rating}</div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-zinc-500 font-bold uppercase">Members</div>
                    <div className="text-white font-mono font-bold">{memberCount}/5</div>
                </div>
            </div>
        </Link>
    )
}
