import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: { include: { product: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <section className="content-page">
      <p className="eyebrow">YOUR ACCOUNT</p><h1>Order history</h1>
      {orders.length === 0 ? <p className="empty-state">You haven’t placed an order yet.</p> : (
        <div className="order-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="section-heading">
                <div><p className="eyebrow">ORDER {order.id.slice(-8).toUpperCase()}</p><p className="muted">{order.createdAt.toLocaleDateString()}</p></div>
                <span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span>
              </div>
              <ul>{order.items.map((item) => <li key={item.id}>{item.quantity} × {item.product.name}</li>)}</ul>
              <strong>Total: ${(order.total / 100).toFixed(2)}</strong>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
