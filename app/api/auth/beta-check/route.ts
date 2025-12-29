import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ hasAccess: true }); // Not logged in = public access
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { betaAccess: true }
    });

    return NextResponse.json({
        hasAccess: user?.betaAccess ?? false
    });
}
