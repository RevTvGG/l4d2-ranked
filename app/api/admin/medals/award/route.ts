import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/admin/medals/award - Award medal to user
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // @ts-expect-error - role and id are custom fields
        if (!session?.user || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, medalId, note } = body;

        if (!userId || !medalId) {
            return NextResponse.json({ error: 'Missing userId or medalId' }, { status: 400 });
        }

        // Check if user already has this medal
        const existing = await prisma.userMedal.findUnique({
            where: {
                userId_medalId: {
                    userId,
                    medalId
                }
            }
        });

        if (existing) {
            return NextResponse.json({ error: 'User already has this medal' }, { status: 400 });
        }

        // @ts-expect-error - id exists
        const ownerId = session.user.id;

        const userMedal = await prisma.userMedal.create({
            data: {
                userId,
                medalId,
                awardedBy: ownerId,
                note: note || null
            },
            include: {
                medal: true,
                user: {
                    select: {
                        name: true,
                        image: true
                    }
                }
            }
        });

        return NextResponse.json({ success: true, userMedal });
    } catch (error) {
        console.error('Error awarding medal:', error);
        return NextResponse.json({ error: 'Failed to award medal' }, { status: 500 });
    }
}
