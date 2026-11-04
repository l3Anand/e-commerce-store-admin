import AdminProducts from "@/components/admin-products";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return <AdminProducts initialProducts={products} />;
}
