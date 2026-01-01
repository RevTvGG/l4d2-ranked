import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const reportSchema = z.object({
    type: z.enum(['BUG', 'PLAYER', 'FEEDBACK']),
    title: z.string().min(1).max(100),
    content: z.string().min(1).max(1000),
    evidence: z.string().url().optional().or(z.literal('')),
    target: z.string().optional(), // SteamID or Player Name
    subType: z.string().optional(), // For BUG: IN_MATCH, WEBSITE, QUEUE, OTHER
    matchId: z.string().optional(), // For in-match bugs
});

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1454980306607280362/XBmbylFD3io2BMsNYvKhahfoXgFgTBkotKNigUwa6luZhKUAicDbyW8DMDxsdoTyBe8l';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const result = reportSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input', details: result.error }, { status: 400 });
        }

        const { type, title, content, evidence, target, subType, matchId } = result.data;

        // Get user with premium status
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, name: true, steamId: true, isPremium: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 1. Save to Database with premium status
        const report = await prisma.report.create({
            data: {
                userId: user.id,
                type,
                title,
                content,
                evidence: evidence || null,
                target: target || null,
                subType: type === 'BUG' ? (subType || 'OTHER') : null,
                matchId: matchId || null,
                isPremium: user.isPremium,
            },
            include: { user: true }
        });

        // 2. Send to Discord with premium indicator
        try {
            await sendToDiscord(report, user);
        } catch (discordError) {
            console.error('Failed to send to Discord:', discordError);
            // Don't fail the request if Discord fails, just log it
        }

        return NextResponse.json({ success: true, reportId: report.id });

    } catch (error) {
        console.error('Report submission failed:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function sendToDiscord(report: any, user: any) {
    if (!DISCORD_WEBHOOK_URL) return;

    let color = 0x3498db; // Blue (Feedback)
    let typeEmoji = '💡';

    if (report.type === 'BUG') {
        color = 0xe67e22; // Orange
        typeEmoji = '🐛';
    } else if (report.type === 'PLAYER') {
        color = 0xe74c3c; // Red
        typeEmoji = '🚨';
    }

    // Premium indicator
    const premiumBadge = user.isPremium ? ' ⭐' : '';
    const premiumTag = user.isPremium ? ' (Premium)' : '';

    const embed = {
        title: `${typeEmoji} New ${report.type} Report${report.subType ? ` [${report.subType}]` : ''}`,
        description: `**Subject:** ${report.title}\n\n**Description:**\n${report.content}`,
        color: color,
        fields: [
            {
                name: `👤 Reporter${premiumBadge}`,
                value: `${user.name}${premiumTag}\n[Profile](https://www.l4d2ranked.online/profile/${encodeURIComponent(user.name || '')})`,
                inline: true
            },
            {
                name: '🆔 Report ID',
                value: `\`${report.id}\``,
                inline: true
            }
        ] as any[],
        timestamp: new Date().toISOString(),
        footer: {
            text: `L4D2 Ranked Reporting System${user.isPremium ? ' | Premium Reporter' : ''}`
        }
    };

    if (report.subType) {
        embed.fields.push({
            name: '📂 Category',
            value: report.subType.replace('_', ' '),
            inline: true
        });
    }

    if (report.matchId) {
        embed.fields.push({
            name: '🎮 Match ID',
            value: `\`${report.matchId}\``,
            inline: true
        });
    }

    if (report.target) {
        embed.fields.push({
            name: '🎯 Target',
            value: `\`${report.target}\``,
            inline: true
        });
    }

    if (report.evidence) {
        embed.fields.push({
            name: '📎 Evidence',
            value: `[View Link](${report.evidence})`,
            inline: false
        });
    }

    await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
    });
}

