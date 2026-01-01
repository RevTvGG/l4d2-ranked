import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // @ts-expect-error
        const userId = session?.user?.id;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || !user.stripeCustomerId) {
            return new NextResponse("No Stripe customer found", { status: 400 });
        }

        const stripeSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${process.env.NEXTAUTH_URL}/premium`,
        });

        return NextResponse.json({ url: stripeSession.url });

    } catch (error) {
        console.error("[STRIPE_PORTAL]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
