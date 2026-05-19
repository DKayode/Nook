// Server-only SVG donut. No JS shipped.
// Slices are sized proportionally to spend; colors are deterministic per category name so
// "Food" is always the same color across renders.

type Slice = { category: string; spendCents: number };

const PALETTE = [
  "#7c5cff", // accent purple
  "#22d3ee", // cyan
  "#a78bfa", // violet
  "#fb7185", // rose
  "#34d399", // emerald
  "#fbbf24", // amber
  "#60a5fa", // blue
  "#c084fc", // purple-light
  "#f43f5e", // pink-deep
  "#10b981", // green
];

function colorFor(category: string): string {
  if (category === "Uncategorized") return "#f59e0b"; // amber, matches the rest of the UI
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function CategoryPieChart({ rows, currency }: { rows: Slice[]; currency: string }) {
  const total = rows.reduce((s, r) => s + r.spendCents, 0);
  if (total === 0) {
    return (
      <div className="rounded-2xl bg-surface p-4">
        <div className="text-xs uppercase tracking-wide text-muted">By category</div>
        <div className="mt-3 text-sm text-muted">No spending in this period.</div>
      </div>
    );
  }

  // Top 7 + "Other" so the donut stays readable.
  const sorted = [...rows].sort((a, b) => b.spendCents - a.spendCents);
  const TOP = 7;
  const top = sorted.slice(0, TOP);
  const tailSum = sorted.slice(TOP).reduce((s, r) => s + r.spendCents, 0);
  const slices: (Slice & { color: string })[] = [
    ...top.map((s) => ({ ...s, color: colorFor(s.category) })),
    ...(tailSum > 0 ? [{ category: "Other", spendCents: tailSum, color: "#52525b" }] : []),
  ];

  // Render donut: walk slices, accumulating angles starting from the top (-90°), clockwise.
  let cum = 0;
  const cx = 100, cy = 100, ro = 90, ri = 55;
  const arcs = slices.map((s) => {
    const startFrac = cum / total;
    cum += s.spendCents;
    const endFrac = cum / total;
    return { ...s, d: describeDonutSlice(cx, cy, ro, ri, startFrac * 360, endFrac * 360) };
  });

  return (
    <div className="rounded-2xl bg-surface p-4">
      <div className="text-xs uppercase tracking-wide text-muted">By category</div>

      <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-5">
        <svg viewBox="0 0 200 200" className="h-44 w-44 shrink-0" aria-label="Spending by category">
          {arcs.map((a) => (
            <path key={a.category} d={a.d} fill={a.color}>
              <title>{`${a.category}: ${format(a.spendCents, currency)} (${Math.round((a.spendCents / total) * 100)}%)`}</title>
            </path>
          ))}
          <text x={cx} y={cy} textAnchor="middle" className="fill-white" fontSize="14" fontWeight="600" dy="-2">
            {format(total, currency)}
          </text>
          <text x={cx} y={cy} textAnchor="middle" className="fill-muted" fontSize="9" dy="14">
            total spend
          </text>
        </svg>

        <ul className="w-full flex-1 space-y-1.5">
          {arcs.map((a) => {
            const pct = (a.spendCents / total) * 100;
            return (
              <li key={a.category} className="flex items-center gap-2 text-xs">
                <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: a.color }} />
                <span className="flex-1 truncate">{a.category}</span>
                <span className="tabular-nums text-muted">
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

// SVG donut slice path. startDeg/endDeg are clockwise from the top (12 o'clock).
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
