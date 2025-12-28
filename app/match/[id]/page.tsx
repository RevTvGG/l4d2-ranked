import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import MatchView from '@/components/match/match-view';

interface MatchPageProps {
    params: {
        id: string;
    };
}

export default async function MatchPage({ params }: MatchPageProps) {
    const match = await prisma.match.findUnique({
        where: { id: params.id },
        include: {
            players: {
                include: {
                    user: true,
                },
            },
        },
    });

    if (!match) {
        notFound();
    }

    return <MatchView initialMatch={match as any} />;
}
