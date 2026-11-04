import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: "Webhook configuration is missing." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed.", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId || session.payment_status !== "paid") return NextResponse.json({ received: true });

    await prisma.$transaction(async (transaction) => {
      const claimed = await transaction.order.updateMany({
        where: { id: orderId, stripeCheckoutSessionId: session.id, status: "PENDING" },
        data: { status: "PAID" }
      });
      if (claimed.count === 0) return;
      const items = await transaction.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        const result = await transaction.product.updateMany({
          where: { id: item.productId, inventory: { gte: item.quantity } },
          data: { inventory: { decrement: item.quantity } }
        });
        if (result.count !== 1) throw new Error(`Insufficient inventory for product ${item.productId}.`);
      }
    });
  }
  return NextResponse.json({ received: true });
}
