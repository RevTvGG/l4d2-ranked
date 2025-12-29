import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

        // Get reporter
        const steamId = (session.user as any).steamId;
        const reporter = await prisma.user.findUnique({
            where: { steamId }
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
            where: { id: reportedUserId }
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

        // Create report
        const report = await prisma.userReport.create({
            data: {
                reason,
                description: description?.slice(0, 500) || null,
                reporterId: reporter.id,
                reportedId: reportedUserId,
                matchId: matchId || null
            }
        });

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
