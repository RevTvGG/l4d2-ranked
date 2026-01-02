import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const title = "Beta Notice";
        const content = `L4D2 Ranked is currently in BETA. You may experience bugs, errors, or unexpected behavior.

Known Limitations:
- Matchmaking may occasionally fail to connect
- Stats may not update immediately
- Server connection issues may occur

Please report issues to our Discord.

IMPORTANT: Before playing, you MUST read our FAQ & Ban Policies.`;

        // Check if already exists
        const existing = await prisma.announcement.findFirst({
            where: { title: title }
        });

        if (existing) {
            return NextResponse.json({ success: true, message: "Already exists" });
        }

        await prisma.announcement.create({
            data: {
                title: title,
                content: content,
                type: "WARNING",
                location: "GLOBAL",
                active: true
            }
        });

        return NextResponse.json({ success: true, message: "Created" });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
