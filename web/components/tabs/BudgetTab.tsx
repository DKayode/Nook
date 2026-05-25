"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BUILTIN_CATEGORY_ICONS,
  DEFAULT_CATEGORY_ICON,
} from "@/lib/categoryIcons";

export type BudgetRow = {
  category: string;
  icon: string | null;
  monthlyLimitCents: number | null;
  monthSpendCents: number;
};

export type BudgetTabData = {
  currency: string;
  rows: BudgetRow[];
};

export function BudgetTab({ data }: { data: BudgetTabData }) {
  const totalLimit = data.rows.reduce((s, r) => s + (r.monthlyLimitCents ?? 0), 0);
  const totalSpend = data.rows.reduce((s, r) => s + r.monthSpendCents, 0);

  return (
    <div className="animate-fade-in space-y-4">
      <header>
        <h2 className="font-display text-2xl font-semibold">Budget</h2>
        <p className="mt-1 text-sm text-muted">
          Set a monthly cap per category. Progress resets on the 1st.
        </p>
      </header>

      <section className="rounded-3xl border border-border-2 bg-bg p-5">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted">This month</div>
            <div className="mt-1 font-display text-2xl font-semibold tabular-nums text-accent">
              {fmt(totalSpend, data.currency)}
              <span className="ml-2 text-sm font-normal text-muted">
                of {totalLimit > 0 ? fmt(totalLimit, data.currency) : "—"}
              </span>
            </div>
          </div>
          <Pct spent={totalSpend} limit={totalLimit} />
        </div>
      </section>

      <ul className="space-y-2">
        {data.rows.map((r) => (
          <BudgetRowItem key={r.category} row={r} currency={data.currency} />
        ))}
      </ul>
    </div>
  );
}

function BudgetRowItem({ row, currency }: { row: BudgetRow; currency: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState<string>(
    row.monthlyLimitCents != null ? (row.monthlyLimitCents / 100).toString() : "",
  );
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    const cents = Math.round(parseFloat(draft || "0") * 100);
    if (!Number.isFinite(cents) || cents < 0) return;
    setBusy(true);
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: row.category, monthlyLimitCents: cents }),
    });
    setBusy(false);
    setEditing(false);
    router.refresh();
  }

  async function clear() {
    setBusy(true);
    await fetch(`/api/budgets?category=${encodeURIComponent(row.category)}`, {
      method: "DELETE",
    });
    setBusy(false);
    setEditing(false);
    setDraft("");
    router.refresh();
  }

  const icon =
    row.icon ?? BUILTIN_CATEGORY_ICONS[row.category] ?? DEFAULT_CATEGORY_ICON;
  const limit = row.monthlyLimitCents ?? 0;
  const pct = limit > 0 ? Math.min(100, (row.monthSpendCents / limit) * 100) : 0;
  const over = limit > 0 && row.monthSpendCents > limit;

  return (
    <li className="rounded-2xl border border-border bg-bg p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-lg" aria-hidden="true">{icon}</span>
          <span className="truncate text-sm font-medium">{row.category}</span>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-ink underline-offset-2 hover:underline"
          >
            {row.monthlyLimitCents != null ? "Edit" : "Set budget"}
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-20 rounded-2xl border border-border bg-bg px-2 py-1 text-right text-sm tabular-nums text-ink outline-none focus:border-ink"
              placeholder="0"
              autoFocus
            />
            <button
              type="button"
              disabled={busy}
              onClick={save}
              className="rounded-2xl border border-ink bg-ink px-2 py-1 text-xs font-medium text-bg disabled:opacity-60"
            >
              Save
            </button>
            {row.monthlyLimitCents != null && (
              <button
                type="button"
                disabled={busy}
                onClick={clear}
                className="rounded-2xl border border-border bg-bg px-2 py-1 text-xs text-muted disabled:opacity-60"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full border border-border">
        <div
          className={`h-full transition-[width] ${over ? "bg-ink" : "bg-accent"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] tabular-nums text-muted">
        <span>{fmt(row.monthSpendCents, currency)} spent</span>
        <span>
          {row.monthlyLimitCents != null
            ? `${fmt(row.monthlyLimitCents, currency)} cap`
            : "no cap"}
          {over && (
            <span className="ml-1 rounded-sm border border-ink px-1 text-[10px] font-bold uppercase text-ink">
              over
            </span>
          )}
        </span>
      </div>
    </li>
  );
}

function Pct({ spent, limit }: { spent: number; limit: number }) {
  if (limit <= 0) {
    return (
      <span className="rounded-full border border-border px-2 py-1 text-[10px] uppercase text-muted">
        no cap
      </span>
    );
  }
  const pct = Math.round((spent / limit) * 100);
  const over = spent > limit;
  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${
        over
          ? "border border-ink bg-ink text-bg"
          : "border border-accent text-accent"
      }`}
    >
      {pct}%
    </span>
  );
}

function fmt(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}
