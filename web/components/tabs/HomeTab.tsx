import Link from "next/link";

export type HomeTabData = {
  currency: string;
  realBalanceCents: number;     // initial + all transactions
  sharedBalanceCents: number;   // sum of obligations user owes to others (placeholder 0 today)
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
      {/* Adjusted balance — the headline figure */}
      <section className="rounded-3xl bg-forest-700 p-6 text-sand shadow-soft dark:bg-forest-700">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold/80">Adjusted balance</div>
        <div className="mt-2 font-display text-4xl font-semibold">{format(adjusted, data.currency)}</div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <Pair label="Real" value={format(data.realBalanceCents, data.currency)} />
          <Pair label="Shared (owed)" value={format(data.sharedBalanceCents, data.currency)} />
        </div>
      </section>

      {/* In / Out cards */}
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

      {/* Ledger */}
      <section className="overflow-hidden rounded-3xl bg-surface shadow-soft">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="font-display text-base font-semibold">Recent transactions</div>
          <Link href="/transactions" className="text-xs font-medium text-gold hover:underline">
            View all →
          </Link>
        </div>
        <ul className="divide-y divide-forest-200 dark:divide-forest-700/60">
          {data.recent.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-muted">
              No transactions yet. Import a CSV to get started.
            </li>
          )}
          {data.recent.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{t.description}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                  <span>{new Date(t.postedAt).toLocaleDateString()}</span>
                  {t.category && (
                    <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold">
                      {t.category}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`shrink-0 font-display text-sm font-semibold tabular-nums ${
                  t.amountCents < 0 ? "" : "text-emerald-500 dark:text-emerald-400"
                }`}
              >
                {format(t.amountCents, data.currency)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-forest-800/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-sand/60">{label}</div>
      <div className="mt-0.5 font-medium tabular-nums">{value}</div>
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
  return (
    <div className="rounded-3xl bg-surface px-4 py-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-muted">
          {label}
        </span>
        <span
          className={`flex size-7 items-center justify-center rounded-full ${
            tone === "up"
              ? "bg-emerald-500/15 text-emerald-500 dark:bg-emerald-400/15 dark:text-emerald-400"
              : "bg-gold/20 text-gold"
          }`}
        >
          {tone === "up" ? "↗" : "↙"}
        </span>
      </div>
      <div className="mt-2 font-display text-xl font-semibold tabular-nums">
        {format(Math.abs(amount), currency)}
      </div>
    </div>
  );
}

function format(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}
