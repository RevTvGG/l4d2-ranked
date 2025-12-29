import { prisma } from "@/lib/prisma";
import { FAQView } from "@/components/faq/FAQView";

export default async function FAQPage() {
    // Fetch Staff
    const staff = await prisma.user.findMany({
        where: { role: { in: ['OWNER', 'ADMIN', 'MODERATOR'] } },
        select: { name: true, image: true, role: true, staffBio: true, steamId: true }
    });

    const sortedStaff = staff.sort((a, b) => {
        const order: Record<string, number> = { OWNER: 0, ADMIN: 1, MODERATOR: 2 };
        return (order[a.role as string] || 99) - (order[b.role as string] || 99);
    });

    return <FAQView staff={sortedStaff} />;
}
