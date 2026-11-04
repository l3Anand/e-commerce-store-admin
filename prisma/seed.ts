import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD before seeding.");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters.");

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash: await bcrypt.hash(password, 12), role: "ADMIN" },
    create: { email, name: "Store Admin", passwordHash: await bcrypt.hash(password, 12), role: "ADMIN" }
  });

  const products = [
    { name: "Everyday Backpack", description: "A durable, thoughtfully organized backpack for work and weekends.", price: 5900, imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80", inventory: 18 },
    { name: "Ceramic Travel Mug", description: "A reusable insulated mug with a comfortable matte finish.", price: 2400, imageUrl: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80", inventory: 32 },
    { name: "Wireless Headphones", description: "Comfortable over-ear headphones with rich sound for daily listening.", price: 8900, imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80", inventory: 12 }
  ];
  for (const product of products) {
    if (!(await prisma.product.findFirst({ where: { name: product.name } }))) {
      await prisma.product.create({ data: product });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
