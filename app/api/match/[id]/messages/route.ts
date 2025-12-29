import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch messages for a match
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const matchId = params.id;

        const messages = await prisma.message.findMany({
            where: { matchId },
            take: 100,
            orderBy: { createdAt: 'asc' },
            include: {
                user: {
                    select: {
                        name: true,
                        image: true,
                        isPremium: true,
                    }
                }
            }
        });

        return NextResponse.json({ messages });
    } catch (error) {
        console.error('Error fetching match messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

// POST - Send a message to match chat
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const matchId = params.id;
        const { content } = await request.json();

        if (!content?.trim()) {
            return NextResponse.json({ error: 'Empty message' }, { status: 400 });
        }

        // Get user from session
        const steamId = (session.user as any).steamId;
        const user = await prisma.user.findUnique({
            where: { steamId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify user is a player in this match
        const matchPlayer = await prisma.matchPlayer.findFirst({
            where: {
                matchId,
                userId: user.id
            }
        });

        if (!matchPlayer) {
            return NextResponse.json({ error: 'You are not a player in this match' }, { status: 403 });
        }

        // Rate limit: 1 message per 2 seconds
        const lastMessage = await prisma.message.findFirst({
            where: {
                userId: user.id,
                matchId,
                createdAt: { gt: new Date(Date.now() - 2000) }
            }
        });

        if (lastMessage) {
            return NextResponse.json({ error: 'Please wait before sending another message' }, { status: 429 });
        }

        // Create message
        const message = await prisma.message.create({
            data: {
                content: content.trim().slice(0, 300),
                userId: user.id,
                matchId
            },
            include: {
                user: {
                    select: {
                        name: true,
                        image: true,
                        isPremium: true
                    }
                }
            }
        });

        return NextResponse.json({ message });
    } catch (error) {
        console.error('Error sending match message:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
