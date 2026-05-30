"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  merchant: string;
  category: string | null;
  amountCents: number;
  currency: string;
  postedAt: Date;
  categories: string[];
};

export function TransactionRow({
  id,
  merchant,
  category,
  amountCents,
  currency,
  postedAt,
  categories,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Form state seeded from the row's current values.
  const [draftDesc, setDraftDesc] = useState(merchant);
  const [draftAmount, setDraftAmount] = useState((amountCents / 100).toString());
  const [draftDate, setDraftDate] = useState(postedAt.toISOString().slice(0, 10));
  const [draftCategory, setDraftCategory] = useState(category ?? "Uncategorized");

  const negative = amountCents < 0;

  async function save() {
    const cents = Math.round(parseFloat(draftAmount) * 100);
    if (!Number.isFinite(cents)) {
      setErr("Amount must be a number.");
      return;
    }
    if (!draftDesc.trim()) {
      setErr("Description is required.");
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: draftDesc.trim(),
        merchant: draftDesc.trim(),
        amountCents: cents,
        postedAt: new Date(`${draftDate}T12:00:00`).toISOString(),
        category: draftCategory,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr("Couldn't save.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Delete this transaction (${merchant})? This cannot be undone.`)) return;
    setBusy(true);
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setErr("Couldn't delete.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition hover:bg-surface"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-medium text-ink">{merchant}</div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted">
            <span>{postedAt.toLocaleDateString()}</span>
            {category && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                {category}
              </span>
            )}
          </div>
        </div>
        <span
          className={`shrink-0 font-medium tabular-nums ${negative ? "text-ink" : "text-accent"}`}
        >
          {new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amountCents / 100)}
        </span>
      </button>

      {open && (
        <div className="animate-fade-in space-y-3 border-t border-border bg-surface px-5 py-4">
          <label className="block">
            <span className="text-[10px] uppercase tracking-wide text-muted">Description</span>
            <input
              value={draftDesc}
              onChange={(e) => setDraftDesc(e.target.value)}
              maxLength={200}
              className="mt-1 w-full rounded-2xl border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[10px] uppercase tracking-wide text-muted">Amount</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={draftAmount}
                onChange={(e) => setDraftAmount(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-border bg-bg px-3 py-2 text-right text-sm tabular-nums text-ink outline-none focus:border-ink"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-wide text-muted">Date</span>
              <input
                type="date"
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-ink"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[10px] uppercase tracking-wide text-muted">Category</span>
            <select
              value={draftCategory}
              onChange={(e) => setDraftCategory(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          {err && <div className="text-xs text-ink">{err}</div>}

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={remove}
              className="rounded-2xl border border-border-2 bg-bg px-3 py-2 text-xs font-medium text-ink hover:bg-surface-2 disabled:opacity-60"
            >
              Delete
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-border bg-bg px-3 py-2 text-xs text-muted hover:bg-surface-2 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={save}
                className="rounded-2xl border border-ink bg-ink px-3 py-2 text-xs font-medium text-bg disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
