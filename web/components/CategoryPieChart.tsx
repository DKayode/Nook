// Server-only SVG donut. The pie is the one place the strict B&W rule relaxes — slices
// pull from a vivid categorical palette so categories are immediately distinguishable
// against the black dashboard. Top spender is lifted out in Emerald (the dashboard's
// established accent). Uncategorized + Other are pinned to gray so the fallback buckets
// never look "highlighted". Hairline #000 strokes between slices keep neighbours readable.

type Slice = { category: string; spendCents: number };

const EMERALD = "#10B981";
const SLICE_BORDER = "#000000";
const UNCATEGORIZED_COLOR = "#525252";
const OTHER_COLOR = "#262626";

// Vivid categorical palette tuned for a black canvas. Order is intentional — frequently
// co-occurring categories should land on visually distinct neighbours, so I avoid putting
// blues next to blues.
const PALETTE = [
  "#38BDF8", // sky
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#F43F5E", // rose
  "#22D3EE", // cyan
  "#FB923C", // orange
  "#84CC16", // lime
  "#E879F9", // fuchsia
  "#6366F1", // indigo
  "#FACC15", // yellow
];

function colorFor(category: string): string {
  if (category === "Uncategorized") return UNCATEGORIZED_COLOR;
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function CategoryPieChart({ rows, currency }: { rows: Slice[]; currency: string }) {
  const total = rows.reduce((s, r) => s + r.spendCents, 0);
  if (total === 0) {
    return (
      <div className="rounded-2xl border border-border bg-bg p-4">
        <div className="text-xs uppercase tracking-wide text-muted">By category</div>
        <div className="mt-3 text-sm text-muted">No spending in this period.</div>
      </div>
    );
  }

  // Top 7 + "Other" so the donut stays readable. The biggest non-fallback category gets
  // the Emerald accent; Uncategorized stays gray even when it's #1 so the highlight always
  // lands on a real spending bucket.
  const sorted = [...rows].sort((a, b) => b.spendCents - a.spendCents);
  const TOP = 7;
  const top = sorted.slice(0, TOP);
  const tailSum = sorted.slice(TOP).reduce((s, r) => s + r.spendCents, 0);
  const topCategory = sorted.find((s) => s.category !== "Uncategorized")?.category;
  const slices: (Slice & { color: string })[] = [
    ...top.map((s) => ({
      ...s,
      color: s.category === topCategory ? EMERALD : colorFor(s.category),
    })),
    ...(tailSum > 0 ? [{ category: "Other", spendCents: tailSum, color: OTHER_COLOR }] : []),
  ];

  let cum = 0;
  const cx = 100, cy = 100, ro = 90, ri = 55;
  const arcs = slices.map((s) => {
    const startFrac = cum / total;
    cum += s.spendCents;
    const endFrac = cum / total;
    return { ...s, d: describeDonutSlice(cx, cy, ro, ri, startFrac * 360, endFrac * 360) };
  });

  return (
    <div className="rounded-2xl border border-border bg-bg p-4">
      <div className="text-xs uppercase tracking-wide text-muted">By category</div>

      <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-5">
        <svg viewBox="0 0 200 200" className="h-44 w-44 shrink-0" aria-label="Spending by category">
          {arcs.map((a) => (
            <path
              key={a.category}
              d={a.d}
              fill={a.color}
              stroke={SLICE_BORDER}
              strokeWidth="1"
              strokeLinejoin="round"
            >
              <title>{`${a.category}: ${format(a.spendCents, currency)} (${Math.round((a.spendCents / total) * 100)}%)`}</title>
            </path>
          ))}
          <text x={cx} y={cy} textAnchor="middle" className="fill-ink" fontSize="14" fontWeight="600" dy="-2">
            {format(total, currency)}
          </text>
          <text x={cx} y={cy} textAnchor="middle" className="fill-muted" fontSize="9" dy="14">
            total spend
          </text>
        </svg>

        <ul className="w-full flex-1 space-y-1.5">
          {arcs.map((a) => {
            const pct = (a.spendCents / total) * 100;
            const isTop = a.category === topCategory;
            return (
              <li key={a.category} className="flex items-center gap-2 text-xs">
                <span
                  className="size-2.5 shrink-0 rounded-sm border border-bg"
                  style={{ backgroundColor: a.color }}
                />
                <span
                  className={`flex-1 truncate ${isTop ? "font-semibold" : ""}`}
                  style={{ color: a.color }}
                >
                  {a.category}
                </span>
                <span className={`tabular-nums ${isTop ? "text-accent" : "text-muted"}`}>
                  {format(a.spendCents, currency)} · {pct.toFixed(0)}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function describeDonutSlice(cx: number, cy: number, ro: number, ri: number, startDeg: number, endDeg: number): string {
  // Full-circle edge case — a slice covering 360° won't render via Arc commands.
  if (Math.abs(endDeg - startDeg) >= 359.999) {
    return [
      `M ${cx},${cy - ro}`,
      `A ${ro},${ro} 0 1 1 ${cx - 0.01},${cy - ro}`,
      `Z`,
      `M ${cx},${cy - ri}`,
      `A ${ri},${ri} 0 1 0 ${cx - 0.01},${cy - ri}`,
      `Z`,
    ].join(" ");
  }
  const sR = ((startDeg - 90) * Math.PI) / 180;
  const eR = ((endDeg - 90) * Math.PI) / 180;
  const x1o = cx + ro * Math.cos(sR), y1o = cy + ro * Math.sin(sR);
  const x2o = cx + ro * Math.cos(eR), y2o = cy + ro * Math.sin(eR);
  const x1i = cx + ri * Math.cos(sR), y1i = cy + ri * Math.sin(sR);
  const x2i = cx + ri * Math.cos(eR), y2i = cy + ri * Math.sin(eR);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${x1o},${y1o}`,
    `A ${ro},${ro} 0 ${large} 1 ${x2o},${y2o}`,
    `L ${x2i},${y2i}`,
    `A ${ri},${ri} 0 ${large} 0 ${x1i},${y1i}`,
    `Z`,
  ].join(" ");
}

function format(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}
