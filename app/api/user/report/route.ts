import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1454980306607280362/XBmbylFD3io2BMsNYvKhahfoXgFgTBkotKNigUwa6luZhKUAicDbyW8DMDxsdoTyBe8l';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { reportedUserId, reason, description, matchId } = await request.json();

        if (!reportedUserId || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate reason
        const validReasons = ['CHEATING', 'TROLLING'];
        if (!validReasons.includes(reason)) {
            return NextResponse.json({ error: 'Invalid report reason' }, { status: 400 });
        }

        // Get reporter with premium status
        const steamId = (session.user as any).steamId;
        const reporter = await prisma.user.findUnique({
            where: { steamId },
            select: { id: true, name: true, steamId: true, isPremium: true }
        });

        if (!reporter) {
            return NextResponse.json({ error: 'Reporter not found' }, { status: 404 });
        }

        // Prevent self-reporting
        if (reporter.id === reportedUserId) {
            return NextResponse.json({ error: 'You cannot report yourself' }, { status: 400 });
        }

        // Check if reported user exists
        const reportedUser = await prisma.user.findUnique({
            where: { id: reportedUserId },
            select: { id: true, name: true, steamId: true }
        });

        if (!reportedUser) {
            return NextResponse.json({ error: 'Reported user not found' }, { status: 404 });
        }

        // Rate limit: 1 report per user per target per 24 hours
        const existingReport = await prisma.userReport.findFirst({
            where: {
                reporterId: reporter.id,
                reportedId: reportedUserId,
                createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
        });

        if (existingReport) {
            return NextResponse.json({
                error: 'You have already reported this user in the last 24 hours'
            }, { status: 429 });
        }

        // Create report with premium status
        const report = await prisma.userReport.create({
            data: {
                reason,
                description: description?.slice(0, 500) || null,
                reporterId: reporter.id,
                reportedId: reportedUserId,
                matchId: matchId || null,
                isPremium: reporter.isPremium
            }
        });

        // Send to Discord
        try {
            await sendToDiscord(report, reporter, reportedUser, reason, description, matchId);
        } catch (discordError) {
            console.error('Failed to send to Discord:', discordError);
        }

        return NextResponse.json({
            success: true,
            message: 'Report submitted successfully',
            reportId: report.id
        });
    } catch (error) {
        console.error('Error creating report:', error);
        return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
    }
}

async function sendToDiscord(
    report: any,
    reporter: { id: string; name: string | null; steamId: string | null; isPremium: boolean },
    reportedUser: { id: string; name: string | null; steamId: string | null },
    reason: string,
    description: string | null,
    matchId: string | null
) {
    if (!DISCORD_WEBHOOK_URL) return;

    const premiumBadge = reporter.isPremium ? ' ⭐' : '';
    const premiumTag = reporter.isPremium ? ' (Premium)' : '';

    const embed = {
        title: `🚨 Player Report: ${reason}`,
        description: description ? `**Details:**\n${description}` : 'No details provided',
        color: reason === 'CHEATING' ? 0xe74c3c : 0xf39c12, // Red for cheating, orange for trolling
        fields: [
            {
                name: `👤 Reporter${premiumBadge}`,
                value: `${reporter.name}${premiumTag}\n[Profile](https://www.l4d2ranked.online/profile/${encodeURIComponent(reporter.name || '')})`,
                inline: true
            },
            {
                name: '🎯 Reported Player',
                value: `${reportedUser.name}\n[Profile](https://www.l4d2ranked.online/profile/${encodeURIComponent(reportedUser.name || '')})`,
                inline: true
            },
            {
                name: '⚠️ Reason',
                value: reason,
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
            text: `L4D2 Ranked Player Report${reporter.isPremium ? ' | Premium Reporter' : ''}`
        }
    };

    if (matchId) {
        embed.fields.push({
            name: '🎮 Match ID',
            value: `\`${matchId}\``,
            inline: true
        });
    }

    await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
    });
}

