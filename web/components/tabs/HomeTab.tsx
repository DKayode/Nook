import Link from "next/link";
import {
  BUILTIN_CATEGORY_ICONS,
  DEFAULT_CATEGORY_ICON,
} from "@/lib/categoryIcons";

export type HomeTabData = {
  currency: string;
  realBalanceCents: number;
  sharedBalanceCents: number;
  incomeCents: number;
  expenseCents: number;
  recent: Array<{
    id: string;
    description: string;
    amountCents: number;
    category: string | null;
    postedAt: string;
  }>;
};

export function HomeTab({ data }: { data: HomeTabData }) {
  const adjusted = data.realBalanceCents - data.sharedBalanceCents;
  return (
    <div className="animate-fade-in space-y-4">
      {/* Adjusted balance — the headline figure. Emerald is allowed here as a balance highlight. */}
      <section className="rounded-3xl border border-border-2 bg-bg p-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted">Adjusted balance</div>
        <div className="mt-2 font-display text-4xl font-semibold text-accent">
          {format(adjusted, data.currency)}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <Pair label="Real" value={format(data.realBalanceCents, data.currency)} />
          <Pair label="Shared (owed)" value={format(data.sharedBalanceCents, data.currency)} />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Counter
          label="Income"
          amount={data.incomeCents}
          currency={data.currency}
          tone="up"
        />
        <Counter
          label="Expenses"
          amount={-data.expenseCents}
          currency={data.currency}
          tone="down"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-bg">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="font-display text-base font-semibold">Recent transactions</div>
          <Link href="/transactions" className="text-xs font-medium text-ink underline-offset-2 hover:underline">
            View all →
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {data.recent.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-muted">
              No transactions yet. Import a CSV to get started.
            </li>
          )}
          {data.recent.map((t) => {
            const icon = t.category
              ? BUILTIN_CATEGORY_ICONS[t.category] ?? DEFAULT_CATEGORY_ICON
              : BUILTIN_CATEGORY_ICONS.Uncategorized;
            return (
              <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-2xl border border-border bg-bg text-base"
                  aria-hidden="true"
                >
                  {icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{t.description}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                    <span>{new Date(t.postedAt).toLocaleDateString()}</span>
                    {t.category && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                        {t.category}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 font-display text-sm font-semibold tabular-nums ${
                    t.amountCents < 0 ? "text-ink" : "text-accent"
                  }`}
                >
                  {format(t.amountCents, data.currency)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 font-medium tabular-nums text-ink">{value}</div>
    </div>
  );
}

function Counter({
  label,
  amount,
  currency,
  tone,
}: {
  label: string;
  amount: number;
  currency: string;
  tone: "up" | "down";
}) {
  // Income is allowed to wear the accent (it's a balance metric); expenses stay monochrome.
  return (
    <div className="rounded-2xl border border-border bg-bg px-4 py-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-muted">{label}</span>
        <span
          className={`flex size-7 items-center justify-center rounded-full border border-border ${
            tone === "up" ? "text-accent" : "text-ink"
          }`}
        >
          {tone === "up" ? "↗" : "↙"}
        </span>
      </div>
      <div
        className={`mt-2 font-display text-xl font-semibold tabular-nums ${
          tone === "up" ? "text-accent" : "text-ink"
        }`}
      >
        {format(Math.abs(amount), currency)}
      </div>
    </div>
  );
}

function format(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}
