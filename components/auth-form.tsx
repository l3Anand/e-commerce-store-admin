"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || "Unable to continue.");
      setBusy(false);
      return;
    }
    window.location.href = "/";
  }

  return (
    <section className="auth-page">
      <p className="eyebrow">{mode === "login" ? "WELCOME BACK" : "JOIN NORTHSTAR"}</p>
      <h1>{mode === "login" ? "Sign in" : "Create your account"}</h1>
      <p className="muted">{mode === "login" ? "Pick up right where you left off." : "A little more good in your everyday."}</p>
      <form className="form-card" onSubmit={submit}>
        {mode === "register" && <label>Name<input name="name" autoComplete="name" required minLength={2} maxLength={80} /></label>}
        <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        <label>Password<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "register" ? 12 : 1} /></label>
        {error && <p className="error-message" role="alert">{error}</p>}
        <button className="button button-dark" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</button>
      </form>
      <p className="auth-switch">{mode === "login" ? "New here?" : "Already have an account?"} <Link href={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "Create an account" : "Sign in"}</Link></p>
    </section>
  );
}
