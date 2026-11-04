import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password || email.length > 254 || password.length > 128) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }
  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
