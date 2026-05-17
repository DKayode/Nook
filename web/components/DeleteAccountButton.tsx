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
      className="text-xs text-muted hover:text-red-300"
    >
      Remove
    </button>
  );
}
