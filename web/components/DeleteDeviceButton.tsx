"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteDeviceButton({ credentialID }: { credentialID: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        if (!confirm("Remove this device? You'll need to use a magic link to sign in from it again.")) return;
        setBusy(true);
        await fetch(`/api/devices?id=${encodeURIComponent(credentialID)}`, { method: "DELETE" });
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
