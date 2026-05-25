"use client";

import Link from "next/link";
import { useState } from "react";

export type SettingsTabData = {
  email: string | null;
  accountCount: number;
  transactionCount: number;
  customCategoryCount: number;
};

export function SettingsTab({ data }: { data: SettingsTabData }) {
  const [exporting, setExporting] = useState(false);

  async function exportJson() {
    setExporting(true);
    try {
      const res = await fetch("/api/export", { method: "GET" });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nook-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-5">
      <header>
        <h2 className="font-display text-2xl font-semibold">Settings</h2>
      </header>

      <section className="rounded-2xl border border-border bg-bg p-5">
        <div className="text-xs uppercase tracking-wide text-muted">
          Signed in as
        </div>
        <div className="mt-1 text-base font-medium">{data.email ?? "—"}</div>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Stat label="Accounts" value={data.accountCount} />
          <Stat label="Transactions" value={data.transactionCount} />
          <Stat label="Custom tags" value={data.customCategoryCount} />
        </dl>
      </section>

      <section className="rounded-2xl border border-border bg-bg p-5">
        <div className="text-sm font-medium">Export a backup</div>
        <p className="mt-1 text-xs text-muted">
          Downloads a JSON snapshot of every account, transaction, custom category, and split.
          Restore by re-importing into a fresh Nook instance.
        </p>
        <button
          type="button"
          onClick={exportJson}
          disabled={exporting}
          className="mt-3 w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm font-medium text-ink transition hover:bg-surface disabled:opacity-60"
        >
          {exporting ? "Preparing…" : "Download JSON"}
        </button>
      </section>

      <section className="rounded-2xl border border-border bg-bg p-5">
        <div className="text-sm font-medium">Profile & syncing</div>
        <ul className="mt-3 space-y-2 text-sm">
          <Row href="/devices" label="Devices" hint="Manage passkeys per device" />
          <Row href="/accounts" label="Accounts" hint="Edit balances and currency" />
          <Row href="/categories" label="Categories" hint="Add, rename, remove custom tags" />
          <Row href="/import" label="Import CSV" hint="Add transactions from a bank export" />
        </ul>
      </section>

      <form
        action={async () => {
          const res = await fetch("/api/auth/signout", { method: "POST" });
          if (res.ok) window.location.assign("/sign-in");
        }}
      >
        <button
          type="submit"
          className="w-full rounded-2xl border border-border-2 bg-bg px-4 py-3 text-sm font-medium text-ink transition hover:bg-surface"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border px-2 py-3">
      <div className="font-display text-xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted">
        {label}
      </div>
    </div>
  );
}

function Row({ href, label, hint }: { href: string; label: string; hint: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between rounded-2xl border border-transparent px-3 py-2 transition hover:border-border hover:bg-surface"
      >
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-muted">{hint}</div>
        </div>
        <span className="text-muted">→</span>
      </Link>
    </li>
  );
}
