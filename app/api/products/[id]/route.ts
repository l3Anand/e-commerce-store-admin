import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = { params: { id: string } };

async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}

export async function PATCH(request: Request, { params }: Context) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (typeof body?.active !== "boolean") {
    return NextResponse.json({ error: "An active status is required." }, { status: 400 });
  }
  try {
    const product = await prisma.product.update({ where: { id: params.id }, data: { active: body.active } });
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  try {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Product could not be deleted. It may be part of an order; hide it instead." }, { status: 409 });
  }
}
