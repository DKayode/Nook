"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await signIn("nodemailer", { email, redirectTo: "/dashboard" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to send link");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        className="w-full rounded-xl border border-white/10 bg-surface px-4 py-3 text-base outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-accent px-4 py-3 font-medium text-white active:scale-[0.99] disabled:opacity-60"
      >
        {busy ? "Sending…" : "Email me a sign-in link"}
      </button>
      {err && <div className="text-sm text-red-300">{err}</div>}
    </form>
  );
}
