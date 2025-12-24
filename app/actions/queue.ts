'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * Join the matchmaking queue
 */
export async function joinQueue() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return { error: 'No autenticado' };
    }

    // @ts-ignore - steamId is custom field
    const steamId = session.user.steamId;

    if (!steamId) {
        return { error: 'SteamID no encontrado' };
    }

    // Obtener usuario de la base de datos
    const user = await prisma.user.findUnique({
        where: { steamId },
        select: { id: true, rating: true }
    });

    if (!user) {
        return { error: 'Usuario no encontrado en la base de datos' };
    }

    const userId = user.id;

    // Verificar si está baneado
    const activeBan = await prisma.ban.findFirst({
        where: {
            userId,
            active: true,
            expiresAt: { gt: new Date() }
        }
    });

    if (activeBan) {
        const remainingMinutes = Math.ceil(
            (activeBan.expiresAt.getTime() - Date.now()) / (60 * 1000)
        );
        return {
            error: `Estás baneado por ${remainingMinutes} minutos más. Razón: ${getBanReasonText(activeBan.reason)}`
        };
    }

    // Verificar si ya está en cola
    const existingEntry = await prisma.queueEntry.findFirst({
        where: {
            userId,
            status: { in: ['WAITING', 'MATCHED'] }
        }
    });

    if (existingEntry) {
        return { error: 'Ya estás en la cola' };
    }

    // Verificar si ya está en una partida activa
    const activeMatch = await prisma.matchPlayer.findFirst({
        where: {
            userId,
            match: {
                status: { in: ['VETO', 'READY', 'IN_PROGRESS', 'PAUSED'] }
            }
        },
        include: { match: true }
    });

    if (activeMatch) {
        return {
            error: 'Ya estás en una partida activa',
            matchId: activeMatch.matchId
        };
    }

    // Crear entrada en cola
    const queueEntry = await prisma.queueEntry.create({
        data: {
            userId,
            mmr: user.rating,
            status: 'WAITING',
            expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
        }
    });

    // Intentar encontrar match
    await findMatch();

    revalidatePath('/play');

    return { success: true, queueEntry };
}

/**
 * Leave the matchmaking queue
 */
export async function leaveQueue() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return { error: 'No autenticado' };
    }

    // @ts-ignore - steamId is custom field
    const steamId = session.user.steamId;

    if (!steamId) {
        return { error: 'SteamID no encontrado' };
    }

    // Obtener usuario de la base de datos
    const user = await prisma.user.findUnique({
        where: { steamId },
        select: { id: true }
    });

    if (!user) {
        return { error: 'Usuario no encontrado' };
    }

    const userId = user.id;

    // Eliminar entrada de cola
    await prisma.queueEntry.deleteMany({
        where: {
            userId,
            status: 'WAITING'
        }
    });

    revalidatePath('/play');

    return { success: true };
}

/**
 * Get current queue status
 */
export async function getQueueStatus() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return null;
    }

    // @ts-ignore - steamId is custom field
    const steamId = session.user.steamId;

    if (!steamId) {
        return null;
    }

    // Obtener usuario de la base de datos
    const user = await prisma.user.findUnique({
        where: { steamId },
        select: { id: true }
    });

    if (!user) {
        return null;
    }

    const userId = user.id;

    // Buscar entrada en cola
    const queueEntry = await prisma.queueEntry.findFirst({
        where: {
            userId,
            status: { in: ['WAITING', 'MATCHED'] }
        },
        include: {
            match: {
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
                    }
                }
            }
        }
    });

    if (!queueEntry) {
        return null;
    }

    // Contar jugadores en cola
    const totalInQueue = await prisma.queueEntry.count({
        where: {
            status: 'WAITING'
        }
    });

    // Obtener info del usuario actual
    const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            image: true,
            rating: true
        }
    });

    return {
        queueEntry,
        totalInQueue,
        match: queueEntry.match,
        currentUser
    };
}

/**
 * Find match for waiting players
 */
export async function findMatch() {
    // Obtener jugadores en espera
    const waitingPlayers = await prisma.queueEntry.findMany({
        where: {
            status: 'WAITING',
            expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'asc' },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    rating: true
                }
            }
        }
    });

    // Necesitamos al menos 8 jugadores
    if (waitingPlayers.length < 8) {
        return { success: false, message: 'No hay suficientes jugadores' };
    }

    // Ordenar por MMR
    waitingPlayers.sort((a, b) => a.mmr - b.mmr);

    // Tomar los primeros 8 jugadores con MMR similar
    const matched = waitingPlayers.slice(0, 8);

    // Verificar que la diferencia de MMR no sea muy grande
    const mmrDiff = matched[7].mmr - matched[0].mmr;
    if (mmrDiff > 500) {
        return { success: false, message: 'Diferencia de MMR muy grande' };
    }

    // Crear match
    const match = await prisma.match.create({
        data: {
            status: 'VETO',
            players: {
                create: matched.map((entry, index) => ({
                    userId: entry.userId,
                    team: index < 4 ? 1 : 2, // Primeros 4 en team 1, resto en team 2
                    accepted: false,
                    connected: false
                }))
            }
        }
    });

    // Actualizar queue entries
    await prisma.queueEntry.updateMany({
        where: {
            id: { in: matched.map(p => p.id) }
        },
        data: {
            status: 'MATCHED',
            matchId: match.id
        }
    });

    // Programar timeout de aceptación (30 segundos)
    setTimeout(() => checkAcceptanceTimeout(match.id), 30 * 1000);

    revalidatePath('/play');

    return { success: true, matchId: match.id };
}

/**
 * Check if all players accepted the match
 */
async function checkAcceptanceTimeout(matchId: string) {
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: { players: true }
    });

    if (!match || match.status !== 'VETO') {
        return; // Match ya fue procesado
    }

    // Verificar si todos aceptaron
    const allAccepted = match.players.every(p => p.accepted);

    if (allAccepted) {
        return; // Todos aceptaron, continuar con veto
    }

    // Encontrar jugadores que no aceptaron
    const afkPlayers = match.players.filter(p => !p.accepted);

    // Banear jugadores AFK
    for (const player of afkPlayers) {
        await prisma.ban.create({
            data: {
                userId: player.userId,
                reason: 'AFK_ACCEPT',
                duration: 5,
                matchId: match.id,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                active: true
            }
        });

        // Incrementar contador de bans
        await prisma.user.update({
            where: { id: player.userId },
            data: { banCount: { increment: 1 } }
        });
    }

    // Cancelar match
    await prisma.match.update({
        where: { id: matchId },
        data: { status: 'CANCELLED' }
    });

    // Devolver jugadores que sí aceptaron a la cola
    const acceptedPlayers = match.players.filter(p => p.accepted);
    for (const player of acceptedPlayers) {
        const user = await prisma.user.findUnique({
            where: { id: player.userId },
            select: { rating: true }
        });

        if (user) {
            await prisma.queueEntry.create({
                data: {
                    userId: player.userId,
                    mmr: user.rating,
                    status: 'WAITING',
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000)
                }
            });
        }
    }

    // Eliminar queue entries del match cancelado
    await prisma.queueEntry.deleteMany({
        where: { matchId }
    });

    revalidatePath('/play');
}

/**
 * Helper function to get ban reason text
 */
function getBanReasonText(reason: string): string {
    switch (reason) {
        case 'AFK_ACCEPT':
            return 'No aceptaste la partida a tiempo';
        case 'NO_JOIN':
            return 'No te uniste al servidor en 5 minutos';
        case 'CRASH':
            return 'Te desconectaste durante una partida';
        case 'MANUAL':
            return 'Ban manual por administrador';
        default:
            return 'Razón desconocida';
    }
}
