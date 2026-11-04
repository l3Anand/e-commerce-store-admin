import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const cookieName = "store_session";
const sessionDuration = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters.");
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${sessionDuration}s`)
    .sign(getSecret());
  cookies().set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionDuration
  });
}

export async function clearSession() {
  cookies().delete(cookieName);
}

export async function getCurrentUser() {
  const token = cookies().get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true }
    });
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
