import Link from "next/link";

type Row = { category: string; spendCents: number };

export function CategoryBreakdown({ rows, currency }: { rows: Row[]; currency: string }) {
  const total = rows.reduce((s, r) => s + r.spendCents, 0);
  // Show top 6, fold the rest into "Other".
  const TOP = 6;
  const sorted = [...rows].sort((a, b) => b.spendCents - a.spendCents);
  const top = sorted.slice(0, TOP);
  const tailSum = sorted.slice(TOP).reduce((s, r) => s + r.spendCents, 0);
  const display: Row[] = tailSum > 0 ? [...top, { category: "Other", spendCents: tailSum }] : top;

  return (
    <div className="rounded-2xl bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-muted">By category</div>
        <Link href="/transactions" className="text-xs text-muted hover:text-white">
          See all
        </Link>
      </div>

      {total === 0 ? (
        <div className="mt-3 text-sm text-muted">No spending in this period.</div>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {display.map((r) => {
            const pct = (r.spendCents / total) * 100;
            const isUncat = r.category === "Uncategorized";
            return (
              <li key={r.category}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className={isUncat ? "text-amber-300" : "text-white"}>{r.category}</span>
                  <span className="tabular-nums text-muted">
                    {format(r.spendCents, currency)} · {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-bg">
                  <div
                    className={`h-full rounded-full ${isUncat ? "bg-amber-400" : "bg-accent"}`}
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function format(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}
