"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CategoryForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error ?? "Couldn't add category");
      return;
    }
    setName("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Childcare, Pets, Investments"
        maxLength={40}
        className="w-full rounded-xl border border-white/10 bg-surface px-4 py-3 outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="w-full rounded-xl bg-accent px-4 py-3 font-medium text-white disabled:opacity-60"
      >
        {busy ? "…" : "Add category"}
      </button>
      {err && <div className="text-sm text-red-300">{err}</div>}
    </form>
  );
}
