"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/webauthn";

export function AddPasskeyButton({ label = "Enroll this device" }: { label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function enroll() {
    setErr(null);
    setBusy(true);
    try {
      await signIn("passkey", { action: "register" });
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Enrollment failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={enroll}
        disabled={busy}
        className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? "Waiting for biometric…" : label}
      </button>
      {err && <div className="mt-2 text-xs text-red-300">{err}</div>}
    </div>
  );
}
