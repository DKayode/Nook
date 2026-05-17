"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function DateRangePicker({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const search = useSearchParams();

  function update(key: "from" | "to", value: string) {
    const params = new URLSearchParams(search.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.push(qs ? `/dashboard?${qs}` : "/dashboard");
  }

  return (
    <div className="flex items-center gap-1 text-xs text-muted">
      <input
        type="date"
        value={from}
        max={to}
        onChange={(e) => update("from", e.target.value)}
        className="rounded-md border border-white/10 bg-surface px-2 py-1 text-xs text-white outline-none focus:border-accent"
      />
      <span>→</span>
      <input
        type="date"
        value={to}
        min={from}
        onChange={(e) => update("to", e.target.value)}
        className="rounded-md border border-white/10 bg-surface px-2 py-1 text-xs text-white outline-none focus:border-accent"
      />
    </div>
  );
}
