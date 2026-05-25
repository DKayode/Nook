"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CategoryIconPicker } from "@/components/CategoryIconPicker";
import {
  BUILTIN_CATEGORY_ICONS,
  DEFAULT_CATEGORY_ICON,
} from "@/lib/categoryIcons";

export type AddTabData = {
  customCategories: { id: string; name: string; icon: string | null }[];
  builtInCategories: string[];
};

export function AddTab({ data }: { data: AddTabData }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>(DEFAULT_CATEGORY_ICON);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed, icon }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setErr(typeof body.error === "string" ? body.error : "Couldn't add this category");
      return;
    }
    setJustAdded(trimmed);
    setName("");
    setIcon(DEFAULT_CATEGORY_ICON);
    router.refresh();
  }

  return (
    <div className="animate-fade-in space-y-5">
      <form onSubmit={submit} className="rounded-3xl bg-surface p-5 shadow-soft">
        <div className="flex items-stretch gap-2">
          <div
            className="flex aspect-square w-14 shrink-0 items-center justify-center rounded-xl bg-bg text-2xl ring-1 ring-border"
            aria-hidden="true"
          >
            {icon}
          </div>
          <label className="block flex-1">
            <span className="text-xs uppercase tracking-wide text-muted">
              Category name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Childcare, Pets, Investments…"
              maxLength={40}
              className="mt-1 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-ink"
            />
          </label>
        </div>

        <div className="mt-4">
          <CategoryIconPicker value={icon} onChange={setIcon} />
        </div>

        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="mt-4 w-full rounded-xl bg-ink px-4 py-3 font-semibold text-bg transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Adding…" : "Add category"}
        </button>
        {err && <div className="mt-2 text-sm text-red-500">{err}</div>}
        {justAdded && (
          <div className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
            Added <span className="font-medium">{justAdded}</span>. Available everywhere now.
          </div>
        )}
      </form>

      <section className="rounded-3xl bg-surface p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wide text-muted">
            Your custom categories
          </div>
          <Link href="/categories" className="text-xs font-medium text-ink hover:underline">
            Manage →
          </Link>
        </div>
        {data.customCategories.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            None yet. Anything you add above shows here.
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {data.customCategories.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-1.5 rounded-full bg-bg px-3 py-1 text-xs font-medium text-ink ring-1 ring-border"
              >
                <span aria-hidden="true">{c.icon ?? DEFAULT_CATEGORY_ICON}</span>
                <span>{c.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-2 text-[11px] uppercase tracking-wide text-muted">
          Built-in defaults
        </div>
        <ul className="flex flex-wrap gap-2">
          {data.builtInCategories.map((c) => (
            <li
              key={c}
              className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-muted ring-1 ring-border"
            >
              <span aria-hidden="true">{BUILTIN_CATEGORY_ICONS[c] ?? DEFAULT_CATEGORY_ICON}</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>

      <Link
        href="/import"
        className="block rounded-3xl border border-dashed border-border bg-surface px-5 py-4 text-center text-sm font-medium text-ink transition hover:bg-surface-2"
      >
        + Import transactions from CSV
      </Link>
    </div>
  );
}
