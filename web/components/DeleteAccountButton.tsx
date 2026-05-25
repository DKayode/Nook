"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteAccountButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        if (!confirm(`Delete "${name}" and all its transactions? This cannot be undone.`)) return;
        setBusy(true);
        await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });
        setBusy(false);
        router.refresh();
      }}
      disabled={busy}
      className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted hover:bg-surface hover:text-ink"
    >
      Remove
    </button>
  );
}
