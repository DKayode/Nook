type Month = {
  key: string;        // "2026-05"
  label: string;      // "May" — already localized
  incomeCents: number;
  expenseCents: number;
};

export function MonthlyComparison({ months, currency }: { months: Month[]; currency: string }) {
  // Bars in each month share a scale so heights are visually comparable across months.
  const max = Math.max(1, ...months.flatMap((m) => [m.incomeCents, m.expenseCents]));
  const avgExpense =
    months.reduce((s, m) => s + m.expenseCents, 0) / Math.max(1, months.filter((m) => m.expenseCents > 0).length);

  return (
    <div className="rounded-2xl bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted">Monthly comparison</div>
          <div className="mt-1 text-sm text-muted">
            Last {months.length} months · avg expense {fmt(avgExpense, currency)}
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-wide text-muted">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-emerald-400" />
            In
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-accent" />
            Out
          </span>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {months.map((m) => {
          const inPct = (m.incomeCents / max) * 100;
          const outPct = (m.expenseCents / max) * 100;
          const overAvg = m.expenseCents > avgExpense * 1.2;
          return (
            <li key={m.key} className="grid grid-cols-[44px_1fr_auto] items-center gap-3">
              <span className="text-xs font-medium text-white">{m.label}</span>
              <div className="space-y-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-bg">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${Math.max(2, inPct)}%` }}
                  />
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-bg">
                  <div
                    className={`h-full rounded-full ${overAvg ? "bg-amber-400" : "bg-accent"}`}
                    style={{ width: `${Math.max(2, outPct)}%` }}
                  />
                </div>
              </div>
              <div className="text-right text-xs tabular-nums">
                <div className="text-emerald-400">{fmt(m.incomeCents, currency)}</div>
                <div className={overAvg ? "text-amber-300" : "text-muted"}>
                  -{fmt(m.expenseCents, currency)}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function fmt(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}
