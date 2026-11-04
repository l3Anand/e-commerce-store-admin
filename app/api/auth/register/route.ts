import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (name.length < 2 || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 || password.length < 12 || password.length > 128) {
    return NextResponse.json({ error: "Enter a valid name and email, and a password between 12 and 128 characters." }, { status: 400 });
  }
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });
  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
}
