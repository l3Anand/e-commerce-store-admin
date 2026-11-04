# Northstar Store

A compact e-commerce MVP built with Next.js, PostgreSQL, Prisma, and Stripe Checkout. It includes customer registration/sign-in, admin-only product management, a shopping bag, server-priced checkout, verified Stripe webhook handling, and order history.

## Requirements

- Node.js 20+
- PostgreSQL 14+
- Stripe account (test mode is sufficient)

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`. Set `DATABASE_URL`, a random `SESSION_SECRET` (at least 32 characters), and Stripe test credentials.
3. Create a PostgreSQL database or point `DATABASE_URL` to an existing one.
4. Generate Prisma Client and create tables: `npm run db:push`
5. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` (at least 12 characters), then run `npm run db:seed` to create the admin and sample products.
6. Start the app: `npm run dev`

Visit `http://localhost:3000`. Sign in with the seeded admin account and open **Admin** to manage products. Customers can register, add in-stock products to their bag, and view orders after checkout.

## Stripe webhooks

For local development, install the Stripe CLI and forward events:

```sh
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the printed signing secret into `STRIPE_WEBHOOK_SECRET`. Orders are marked paid and inventory is decremented only after a valid `checkout.session.completed` event. Set `NEXT_PUBLIC_APP_URL` to the canonical HTTPS origin in production.

## Deployment

- Set every variable from `.env.example` in the hosting provider; never commit `.env` or live credentials.
- Run `npm run db:push` for initial deployment, then adopt reviewed Prisma migrations for a production schema-change workflow.
- Register `https://your-domain.example/api/stripe/webhook` in Stripe and subscribe to `checkout.session.completed`.
- Registration always creates customer-role accounts; roles are never accepted from client input. Seed an admin with a unique, strong password.

## MVP boundaries

The storefront uses USD and Stripe-hosted checkout. Inventory is checked before checkout and decremented transactionally when payment is confirmed. This initial MVP does not include shipping/tax calculation, refunds, customer address management, or reservation of inventory while a checkout is pending.
