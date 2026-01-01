import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: Request) {
    const body = await req.text();
    const signature = headers().get("Stripe-Signature") as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        return new NextResponse("Webhook secret not configured", { status: 500 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            webhookSecret
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    try {
        if (event.type === "checkout.session.completed") {
            const subscriptionId = session.subscription as string;
            const customerId = session.customer as string;

            // Retrieve the subscription details to get the expiration date
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);

            if (!session.metadata?.userId) {
                // If metadata is missing, we try to find by customerId
                await prisma.user.update({
                    where: { stripeCustomerId: customerId },
                    data: {
                        isPremium: true,
                        stripeSubscriptionId: subscriptionId,
                        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                        premiumSince: new Date(),
                    }
                });
            } else {
                await prisma.user.update({
                    where: { id: session.metadata.userId },
                    data: {
                        isPremium: true,
                        stripeSubscriptionId: subscriptionId,
                        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                        stripeCustomerId: customerId, // Ensure link
                        premiumSince: new Date(),
                    }
                });
            }
        }

        if (event.type === "invoice.payment_succeeded") {
            const subscriptionId = session.subscription as string;
            // Retrieve subscription to get new period end
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);

            // Find user by subscription ID
            await prisma.user.update({
                where: { stripeSubscriptionId: subscriptionId },
                data: {
                    stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                }
            });
        }

        // Handle failed payment (subscription cancelled or failed)
        if (event.type === 'customer.subscription.deleted') {
            const subscriptionId = (event.data.object as Stripe.Subscription).id;

            await prisma.user.update({
                where: { stripeSubscriptionId: subscriptionId },
                data: {
                    isPremium: false,
                    stripeCurrentPeriodEnd: null,
                }
            });
        }

        return new NextResponse(null, { status: 200 });

    } catch (error) {
        console.error("[STRIPE_WEBHOOK_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
