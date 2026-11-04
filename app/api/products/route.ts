import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const price = body?.price;
  const inventory = body?.inventory;
  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";

  if (name.length < 2 || name.length > 120 || !description || description.length > 2000 ||
      !Number.isSafeInteger(price) || price < 1 || price > 100_000_000 ||
      !Number.isSafeInteger(inventory) || inventory < 0 || inventory > 100_000 ||
      (imageUrl && (imageUrl.length > 2000 || !/^https?:\/\//i.test(imageUrl)))) {
    return NextResponse.json({ error: "Check the product details and try again." }, { status: 400 });
  }
  const product = await prisma.product.create({
    data: { name, description, price, inventory, imageUrl: imageUrl || null }
  });
  return NextResponse.json({ product }, { status: 201 });
}
