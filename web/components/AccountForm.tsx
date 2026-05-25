"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPES = ["checking", "savings", "credit", "cash", "other"] as const;

export function AccountForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("checking");
  const [currency, setCurrency] = useState("EUR");
  const [initialBalance, setInitialBalance] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const initialBalanceCents = Math.round(parseFloat(initialBalance || "0") * 100);
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, currency: currency.toUpperCase(), initialBalanceCents }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr("Couldn't create account.");
      return;
    }
    setName("");
    setInitialBalance("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Account name (Checking, Visa, …)"
        maxLength={80}
        required
        className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-ink outline-none focus:border-ink"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
          className="rounded-2xl border border-border bg-bg px-4 py-3 text-ink outline-none focus:border-ink"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          maxLength={3}
          placeholder="EUR"
          className="rounded-2xl border border-border bg-bg px-4 py-3 text-ink outline-none focus:border-ink"
        />
      </div>
      <input
        inputMode="decimal"
        value={initialBalance}
        onChange={(e) => setInitialBalance(e.target.value)}
        placeholder="Opening balance (e.g. 1250.00)"
        className="w-full rounded-2xl border border-border bg-bg px-4 py-3 text-ink outline-none focus:border-ink"
      />
      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="w-full rounded-2xl border border-ink bg-ink px-4 py-3 font-medium text-bg disabled:opacity-60"
      >
        {busy ? "Adding…" : "Add account"}
      </button>
      {err && <div className="text-sm text-ink">{err}</div>}
    </form>
  );
}
