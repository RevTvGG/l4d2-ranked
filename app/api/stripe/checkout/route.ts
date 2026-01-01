import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Verfied path
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const PRICE_ID = process.env.STRIPE_PRICE_ID;

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || !session.user.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!PRICE_ID) {
            return new NextResponse("Stripe Price ID not configured", { status: 500 });
        }

        // Get or create customer
        // We might want to save the customer ID if it already exists
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        let stripeCustomerId = user.stripeCustomerId;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name || "Ranked Player",
                metadata: {
                    userId: user.id,
                }
            });
            stripeCustomerId = customer.id;

            await prisma.user.update({
                where: { id: user.id },
                data: { stripeCustomerId }
            });
        }

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: "subscription",
            billing_address_collection: "auto",
            line_items: [
                {
                    price: PRICE_ID,
                    quantity: 1,
                }
            ],
            success_url: `${process.env.NEXTAUTH_URL}/premium?success=true`,
            cancel_url: `${process.env.NEXTAUTH_URL}/premium?canceled=true`,
            subscription_data: {
                metadata: {
                    userId: user.id
                }
            }
        });

        return NextResponse.json({ url: checkoutSession.url });

    } catch (error) {
        console.error("[STRIPE_CHECKOUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
