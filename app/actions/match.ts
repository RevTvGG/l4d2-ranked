'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * Accept a match
 */
export async function acceptMatch(matchId: string) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return { error: 'No autenticado' };
    }

    const userId = session.user.id;

    // Verificar que el jugador esté en la partida
    const matchPlayer = await prisma.matchPlayer.findFirst({
        where: {
            matchId,
            userId
        }
    });

    if (!matchPlayer) {
        return { error: 'No estás en esta partida' };
    }

    if (matchPlayer.accepted) {
        return { error: 'Ya aceptaste esta partida' };
    }

    // Marcar como aceptado
    await prisma.matchPlayer.update({
        where: { id: matchPlayer.id },
        data: { accepted: true }
    });

    // Verificar si todos aceptaron
    const allPlayers = await prisma.matchPlayer.findMany({
        where: { matchId }
    });

    const allAccepted = allPlayers.every(p => p.accepted);

    if (allAccepted) {
        // Todos aceptaron, pasar a fase de veto
        await prisma.match.update({
            where: { id: matchId },
            data: { status: 'VETO' }
        });

        // Programar timeout de veto (60 segundos)
        setTimeout(() => finalizeVeto(matchId), 60 * 1000);
    }

    revalidatePath('/play');
    revalidatePath(`/match/${matchId}`);

    return { success: true, allAccepted };
}

/**
 * Vote for a map
 */
export async function voteMap(matchId: string, map: string) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return { error: 'No autenticado' };
    }

    const userId = session.user.id;

    // Verificar que el jugador esté en la partida
    const matchPlayer = await prisma.matchPlayer.findFirst({
        where: {
            matchId,
            userId
        }
    });

    if (!matchPlayer) {
        return { error: 'No estás en esta partida' };
    }

    // Verificar que la partida esté en fase de veto
    const match = await prisma.match.findUnique({
        where: { id: matchId }
    });

    if (!match || match.status !== 'VETO') {
        return { error: 'La votación ha terminado' };
    }

    // Crear o actualizar voto
    await prisma.mapVote.upsert({
        where: {
            matchId_userId: {
                matchId,
                userId
            }
        },
        create: {
            matchId,
            userId,
            map
        },
        update: {
            map
        }
    });

    // Verificar si todos votaron
    const totalPlayers = await prisma.matchPlayer.count({
        where: { matchId }
    });

    const totalVotes = await prisma.mapVote.count({
        where: { matchId }
    });

    if (totalVotes === totalPlayers) {
        // Todos votaron, finalizar veto inmediatamente
        await finalizeVeto(matchId);
    }

    revalidatePath(`/match/${matchId}`);

    return { success: true };
}

/**
 * Finalize map veto and select winner
 */
export async function finalizeVeto(matchId: string) {
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: { mapVotes: true }
    });

    if (!match || match.status !== 'VETO') {
        return; // Ya fue procesado
    }

    // Contar votos por mapa
    const voteCounts = match.mapVotes.reduce((acc, vote) => {
        acc[vote.map] = (acc[vote.map] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Encontrar mapa(s) con más votos
    const maxVotes = Math.max(...Object.values(voteCounts));
    const winners = Object.keys(voteCounts).filter(
        map => voteCounts[map] === maxVotes
    );

    // Si hay empate, seleccionar aleatoriamente
    const selectedMap = winners[Math.floor(Math.random() * winners.length)];

    // Actualizar match
    await prisma.match.update({
        where: { id: matchId },
        data: {
            selectedMap,
            status: 'READY'
        }
    });

    // TODO: Asignar servidor aquí
    // await assignServer(matchId);

    revalidatePath(`/match/${matchId}`);
}

/**
 * Get match details
 */
export async function getMatch(matchId: string) {
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
            players: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                            rating: true
                        }
                    }
                }
            },
            mapVotes: {
                include: {
                    user: {
                        select: {
                            name: true
                        }
                    }
                }
            },
            rounds: {
                orderBy: { roundNumber: 'asc' }
            }
        }
    });

    return match;
}

/**
 * Get available maps for voting
 */
export async function getAvailableMaps() {
    return [
        { id: 'c1m1_hotel', name: 'Dead Center', chapters: 3 },
        { id: 'c2m1_highway', name: 'Dark Carnival', chapters: 4 },
        { id: 'c3m1_plankcountry', name: 'Swamp Fever', chapters: 4 },
        { id: 'c4m1_milltown_a', name: 'Hard Rain', chapters: 4 },
        { id: 'c5m1_waterfront', name: 'The Parish', chapters: 4 },
        { id: 'c6m1_riverbank', name: 'The Passing', chapters: 3 },
        { id: 'c7m1_docks', name: 'The Sacrifice', chapters: 3 },
        { id: 'c8m1_apartment', name: 'No Mercy', chapters: 4 },
        { id: 'c9m1_alleys', name: 'Crash Course', chapters: 2 },
        { id: 'c10m1_caves', name: 'Death Toll', chapters: 4 },
        { id: 'c11m1_greenhouse', name: 'Dead Air', chapters: 4 },
        { id: 'c12m1_hilltop', name: 'Blood Harvest', chapters: 4 },
        { id: 'c13m1_alpinecreek', name: 'Cold Stream', chapters: 4 }
    ];
}

