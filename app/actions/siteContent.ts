'use server';

import { prisma } from '@/lib/prisma';

export async function getSiteContent(key: string): Promise<string | null> {
    try {
        const content = await prisma.siteContent.findUnique({
            where: { key }
        });
        return content?.content || null;
    } catch (error) {
        console.error('Error fetching site content:', error);
        return null;
    }
}

export async function getServerNews(): Promise<string> {
    const content = await getSiteContent('server_news');
    return content || "Don't forget to join our Discord for tournament announcements. Season 1 ends in 2 weeks!";
}
