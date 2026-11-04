import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}

export async function PATCH(request: Request, { params }: Context) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.active === "boolean" && Object.keys(body).length === 1) {
    try {
      const product = await prisma.product.update({ where: { id }, data: { active: body.active } });
      return NextResponse.json({ product });
    } catch {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
  }
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
  try {
    const product = await prisma.product.update({
      where: { id },
      data: { name, description, price, inventory, imageUrl: imageUrl || null }
    });
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Product could not be deleted. It may be part of an order; hide it instead." }, { status: 409 });
  }
}
