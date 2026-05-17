"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RecategorizeButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/transactions/recategorize", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error?.toString?.() ?? "Failed");
      } else {
        setMsg(`Updated ${data.updated} of ${data.total}.`);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={run}
        disabled={busy}
        className="w-full rounded-xl bg-surface px-4 py-3 text-sm font-medium ring-1 ring-white/10 active:scale-[0.99] disabled:opacity-60"
      >
        {busy ? "Recategorizing…" : "Recategorize all"}
      </button>
      {msg && <div className="mt-2 text-xs text-muted">{msg}</div>}
    </div>
  );
}
