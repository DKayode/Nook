"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryIconPicker } from "@/components/CategoryIconPicker";
import { DEFAULT_CATEGORY_ICON } from "@/lib/categoryIcons";

export function CategoryForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>(DEFAULT_CATEGORY_ICON);
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
      body: JSON.stringify({ name, icon }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error ?? "Couldn't add category");
      return;
    }
    setName("");
    setIcon(DEFAULT_CATEGORY_ICON);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-stretch gap-2">
        <div
          className="flex aspect-square w-14 shrink-0 items-center justify-center rounded-xl bg-surface text-2xl ring-1 ring-border"
          aria-hidden="true"
        >
          {icon}
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Childcare, Pets, Investments"
          maxLength={40}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-ink"
        />
      </div>
      <CategoryIconPicker value={icon} onChange={setIcon} />
      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="w-full rounded-xl bg-ink px-4 py-3 font-medium text-bg disabled:opacity-60"
      >
        {busy ? "…" : "Add category"}
      </button>
      {err && <div className="text-sm text-red-500">{err}</div>}
    </form>
  );
}
