import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Northstar Store",
  description: "A considered collection of everyday essentials."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link className="brand" href="/">NORTHSTAR<span> / GOODS</span></Link>
          <nav aria-label="Main navigation">
            <Link href="/">Shop</Link>
            {user && <Link href="/orders">Orders</Link>}
            {user?.role === "ADMIN" && <Link href="/admin">Admin</Link>}
            {user
              ? <form action="/api/auth/logout" method="post"><button className="nav-button">Sign out</button></form>
              : <Link href="/login">Sign in</Link>}
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">Thoughtful goods for everyday living.</footer>
      </body>
    </html>
  );
}
