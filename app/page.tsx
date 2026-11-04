import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Storefront from "@/components/storefront";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, user] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, description: true, price: true, imageUrl: true, inventory: true }
    }),
    getCurrentUser()
  ]);
  return <Storefront products={products} signedIn={Boolean(user)} />;
}
