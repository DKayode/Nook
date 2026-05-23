"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type AddTabData = {
  customCategories: { id: string; name: string }[];
  builtInCategories: string[];
};

export function AddTab({ data }: { data: AddTabData }) {
  const router = useRouter();
  const [name, setName] = useState("");
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
      body: JSON.stringify({ name: trimmed }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setErr(typeof body.error === "string" ? body.error : "Couldn't add this category");
      return;
    }
    setJustAdded(trimmed);
    setName("");
    router.refresh();
  }

  return (
    <div className="animate-fade-in space-y-5">
      <header>
        <h2 className="font-display text-2xl font-semibold">Add a category</h2>
        <p className="mt-1 text-sm text-muted">
          Custom categories appear in the dropdown next to every transaction and are added to the
          AI&apos;s allowed list on the next import.
        </p>
      </header>

      <form onSubmit={submit} className="rounded-3xl bg-surface p-5 shadow-soft">
        <label className="block">
          <span className="text-xs uppercase tracking-wide text-muted">
            Category name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Childcare, Pets, Investments…"
            maxLength={40}
            className="mt-1 w-full rounded-xl border border-forest-200 bg-bg px-4 py-3 text-base outline-none focus:border-gold dark:border-forest-700"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="mt-3 w-full rounded-xl bg-gold px-4 py-3 font-semibold text-forest transition hover:bg-gold-300 disabled:opacity-60"
        >
          {busy ? "Adding…" : "Add category"}
        </button>
        {err && <div className="mt-2 text-sm text-red-500">{err}</div>}
        {justAdded && (
          <div className="mt-2 text-sm text-emerald-500 dark:text-emerald-400">
            Added <span className="font-medium">{justAdded}</span>. Available everywhere now.
          </div>
        )}
      </form>

      <section className="rounded-3xl bg-surface p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wide text-muted">
            Your custom categories
          </div>
          <Link href="/categories" className="text-xs font-medium text-gold hover:underline">
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
                className="rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-gold ring-1 ring-gold/30"
              >
                {c.name}
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
              className="rounded-full bg-surface px-3 py-1 text-xs text-muted ring-1 ring-forest-700/30"
            >
              {c}
            </li>
          ))}
        </ul>
      </section>

      <Link
        href="/import"
        className="block rounded-3xl border border-dashed border-gold/40 bg-gold/5 px-5 py-4 text-center text-sm font-medium text-gold transition hover:bg-gold/10"
      >
        + Import transactions from CSV
      </Link>
    </div>
  );
}
