'use server';

import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1455678515939643543/op_ePREATFMDcbpVz_Z_uOD_E6Ea6sDAEseRi7soXu_ivnvT5kcBknAYWoERkUV6fe1D';

interface BetaRequestData {
    steamId: string;
    steamUrl?: string;
    discord?: string;
    country: string;
    otherCommunity?: string;
    agreesWith2FA: boolean;
    howHeardAbout: string;
    whyInterested: string;
    language: string;
}

export async function submitBetaRequest(data: BetaRequestData) {
    try {
        // Check if already submitted
        const existing = await prisma.betaRequest.findUnique({
            where: { steamId: data.steamId }
        });

        if (existing) {
            return {
                success: false,
                error: data.language === 'es'
                    ? 'Ya has enviado una solicitud con este Steam ID.'
                    : 'You have already submitted a request with this Steam ID.'
            };
        }

        // Get metadata
        const headersList = await headers();
        const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'Unknown';
        const userAgent = headersList.get('user-agent') || 'Unknown';

        // Create request in database
        const request = await prisma.betaRequest.create({
            data: {
                steamId: data.steamId,
                steamUrl: data.steamUrl || null,
                discord: data.discord || null,
                country: data.country,
                otherCommunity: data.otherCommunity || null,
                agreesWith2FA: data.agreesWith2FA,
                howHeardAbout: data.howHeardAbout,
                whyInterested: data.whyInterested,
                language: data.language,
                ipAddress,
                userAgent,
                status: 'PENDING'
            }
        });

        // Send to Discord webhook
        await sendToDiscord(request, data);

        return {
            success: true,
            message: data.language === 'es'
                ? '¡Solicitud enviada! Tienes más probabilidades de ser seleccionado.'
                : 'Request submitted! You have a higher chance of being selected.'
        };
    } catch (error) {
        console.error('[BetaRequest] Error:', error);
        return {
            success: false,
            error: data.language === 'es'
                ? 'Error al enviar la solicitud. Inténtalo de nuevo.'
                : 'Error submitting request. Please try again.'
        };
    }
}

async function sendToDiscord(request: any, data: BetaRequestData) {
    const embed = {
        title: '🎮 Nueva Solicitud de Beta Access',
        color: 0x00ff66, // Brand green
        fields: [
            {
                name: '🎮 Steam',
                value: `ID: \`${data.steamId}\`${data.steamUrl ? `\nURL: ${data.steamUrl}` : ''}`,
                inline: true
            },
            {
                name: '🌍 País',
                value: data.country,
                inline: true
            },
            {
                name: '💬 Discord',
                value: data.discord || 'No proporcionado',
                inline: true
            },
            {
                name: '🏆 Otra comunidad competitiva',
                value: data.otherCommunity || 'No',
                inline: true
            },
            {
                name: '🔒 Acepta 2FA',
                value: data.agreesWith2FA ? '✅ Sí' : '❌ No',
                inline: true
            },
            {
                name: '🌐 Idioma',
                value: data.language === 'es' ? '🇪🇸 Español' : '🇺🇸 English',
                inline: true
            },
            {
                name: '📣 ¿Cómo se enteró?',
                value: data.howHeardAbout.substring(0, 1024),
                inline: false
            },
            {
                name: '💭 ¿Por qué quiere participar?',
                value: data.whyInterested.substring(0, 1024),
                inline: false
            }
        ],
        footer: {
            text: `ID: ${request.id} | ${new Date().toLocaleString()}`
        },
        timestamp: new Date().toISOString()
    };

    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'L4D2 Ranked Beta',
                avatar_url: 'https://www.l4d2ranked.online/logo.png',
                embeds: [embed]
            })
        });
    } catch (error) {
        console.error('[Discord] Webhook error:', error);
    }
}

export async function checkExistingRequest(steamId: string) {
    const existing = await prisma.betaRequest.findUnique({
        where: { steamId }
    });
    return !!existing;
}
