"use client";

import { useState } from "react";
import { signIn as signInWeb } from "next-auth/react";
import { signIn as signInWebauthn } from "next-auth/webauthn";

type Mode = "passkey" | "email";

export function SignInForm() {
  const [mode, setMode] = useState<Mode>("passkey");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  async function tryPasskey() {
    setErr(null);
    setBusy(true);
    try {
      // No email — relies on conditional-UI / discoverable credentials. The browser
      // surfaces any passkey saved for this origin (synced via iCloud / Google / etc.).
      await signInWebauthn("passkey", { redirectTo: "/dashboard" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Passkey sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setErr(null);
    setBusy(true);
    try {
      await signInWeb("nodemailer", { email, redirectTo: "/dashboard" });
      setEmailSent(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't send link");
    } finally {
      setBusy(false);
    }
  }

  if (emailSent) {
    return (
      <div className="rounded-2xl bg-surface p-5 text-center text-sm">
        <div className="text-base font-medium">Check your inbox</div>
        <p className="mt-2 text-muted">
          We sent a sign-in link to <span className="text-white">{email}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mode === "passkey" ? (
        <>
          <button
            type="button"
            onClick={tryPasskey}
            disabled={busy}
            className="w-full rounded-xl bg-accent px-4 py-3 font-medium text-white active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? "…" : "Continue with passkey"}
          </button>
          <p className="text-center text-xs text-muted">
            Uses Face ID / Touch ID / Windows Hello if you&apos;ve enrolled on this device.
          </p>
          <button
            type="button"
            onClick={() => {
              setErr(null);
              setMode("email");
            }}
            className="block w-full text-center text-sm text-muted hover:text-white"
          >
            New device? Sign in by email instead
          </button>
        </>
      ) : (
        <form onSubmit={sendEmail} className="space-y-3">
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
            disabled={busy || !email.trim()}
            className="w-full rounded-xl bg-accent px-4 py-3 font-medium text-white disabled:opacity-60"
          >
            {busy ? "Sending…" : "Email me a sign-in link"}
          </button>
          <button
            type="button"
            onClick={() => setMode("passkey")}
            className="block w-full text-center text-sm text-muted hover:text-white"
          >
            ← Back to passkey
          </button>
        </form>
      )}

      {err && <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{err}</div>}
    </div>
  );
}
