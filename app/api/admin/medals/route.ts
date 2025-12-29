import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/medals - List all medals
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        // @ts-expect-error - role is custom field
        if (!session?.user || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const medals = await prisma.medal.findMany({
            orderBy: [
                { rarity: 'desc' },
                { createdAt: 'desc' }
            ],
            include: {
                _count: {
                    select: { awards: true }
                }
            }
        });

        return NextResponse.json({ success: true, medals });
    } catch (error) {
        console.error('Error fetching medals:', error);
        return NextResponse.json({ error: 'Failed to fetch medals' }, { status: 500 });
    }
}

// POST /api/admin/medals - Create new medal
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // @ts-expect-error - role is custom field
        if (!session?.user || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, icon, color, rarity } = body;

        // Validation
        if (!name || !description || !icon) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // @ts-expect-error - id exists
        const ownerId = session.user.id;

        const medal = await prisma.medal.create({
            data: {
                name,
                description,
                icon,
                color: color || '#22c55e',
                rarity: rarity || 'COMMON',
                createdBy: ownerId
            }
        });

        return NextResponse.json({ success: true, medal });
    } catch (error) {
        console.error('Error creating medal:', error);
        return NextResponse.json({ error: 'Failed to create medal' }, { status: 500 });
    }
}
