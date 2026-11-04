import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to checkout." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!Array.isArray(body?.items) || body.items.length < 1 || body.items.length > 50) {
    return NextResponse.json({ error: "Your bag is empty or invalid." }, { status: 400 });
  }
  const quantities = new Map<string, number>();
  for (const item of body.items) {
    if (typeof item?.productId !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      return NextResponse.json({ error: "One or more items have an invalid quantity." }, { status: 400 });
    }
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }
  if ([...quantities.values()].some((quantity) => quantity > 20)) {
    return NextResponse.json({ error: "You can order at most 20 of each item." }, { status: 400 });
  }

  const products = await prisma.product.findMany({ where: { id: { in: [...quantities.keys()] }, active: true } });
  if (products.length !== quantities.size) return NextResponse.json({ error: "A product in your bag is no longer available." }, { status: 400 });
  for (const product of products) {
    if (product.inventory < quantities.get(product.id)!) {
      return NextResponse.json({ error: `${product.name} does not have enough stock.` }, { status: 409 });
    }
  }
  const total = products.reduce((sum, product) => sum + product.price * quantities.get(product.id)!, 0);
  if (!Number.isSafeInteger(total) || total < 1) return NextResponse.json({ error: "The order total is invalid." }, { status: 400 });

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      total,
      items: {
        create: products.map((product) => ({
          productId: product.id,
          quantity: quantities.get(product.id)!,
          unitPrice: product.price
        }))
      }
    }
  });
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: products.map((product) => ({
        quantity: quantities.get(product.id)!,
        price_data: {
          currency: order.currency,
          unit_amount: product.price,
          product_data: { name: product.name, description: product.description.slice(0, 500) }
        }
      })),
      metadata: { orderId: order.id, userId: user.id },
      success_url: `${origin}/orders?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    await prisma.order.update({ where: { id: order.id }, data: { stripeCheckoutSessionId: session.id } });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    console.error("Stripe checkout session creation failed.", error);
    return NextResponse.json({ error: "Secure checkout is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
