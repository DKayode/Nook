"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  transactionId: string;
  current: string | null;
  options: string[];
};

export function CategoryPicker({ transactionId, current, options }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(current ?? "Uncategorized");
  const [busy, setBusy] = useState(false);

  async function update(next: string) {
    if (next === value) return;
    const prev = value;
    setValue(next);
    setBusy(true);
    const res = await fetch(`/api/transactions/${transactionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: next }),
    });
    setBusy(false);
    if (!res.ok) {
      setValue(prev);
      return;
    }
    router.refresh();
  }

  const isUncategorized = value === "Uncategorized";

  return (
    <select
      value={value}
      onChange={(e) => update(e.target.value)}
      disabled={busy}
      onClick={(e) => e.stopPropagation()}
      className={`max-w-[140px] truncate rounded-2xl border bg-bg px-2 py-1 text-xs outline-none focus:border-ink ${
        isUncategorized ? "border-ink text-ink" : "border-border text-muted"
      }`}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
