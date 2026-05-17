// Server-only SVG sparkline. No JS shipped. Bars represent absolute daily spend
// (income excluded). The tallest bar = 100% height; others scale proportionally.

type Day = { date: string; spendCents: number };

export function DailySpendChart({
  days,
  currency,
  label,
}: {
  days: Day[];
  currency: string;
  label: string;
}) {
  const width = 320;
  const height = 80;
  const padBottom = 14;
  const padTop = 4;
  const max = Math.max(1, ...days.map((d) => d.spendCents));
  const barW = days.length > 0 ? (width - 4) / days.length : 0;
  const total = days.reduce((s, d) => s + d.spendCents, 0);
  const avg = days.length > 0 ? total / days.length : 0;

  return (
    <div className="rounded-2xl bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
          <div className="mt-1 text-2xl font-semibold">{format(total, currency)}</div>
        </div>
        <div className="text-right text-xs text-muted">
          <div>avg / day</div>
          <div className="text-sm text-white">{format(avg, currency)}</div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-3 block w-full"
        preserveAspectRatio="none"
        aria-label="Daily spend over time"
      >
        {days.map((d, i) => {
          const h = (d.spendCents / max) * (height - padTop - padBottom);
          const x = 2 + i * barW;
          const y = height - padBottom - h;
          return (
            <rect
              key={d.date}
              x={x}
              y={y}
              width={Math.max(1, barW - 1)}
              height={Math.max(1, h)}
              rx={1}
              className="fill-accent/80"
            >
              <title>{`${new Date(d.date).toLocaleDateString()} — ${format(d.spendCents, currency)}`}</title>
            </rect>
          );
        })}
        {days.length >= 2 && (
          <>
            <text x={2} y={height - 2} className="fill-muted" fontSize="9">
              {fmtShort(days[0].date)}
            </text>
            <text x={width - 2} y={height - 2} textAnchor="end" className="fill-muted" fontSize="9">
              {fmtShort(days[days.length - 1].date)}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

function format(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

function fmtShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
