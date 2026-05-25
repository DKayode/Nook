// Server-only SVG area chart. Bold emerald (#10B981) trend line + matching gradient fill,
// rendered over the dashboard's black canvas. No JS shipped.

type Point = { label: string; valueCents: number };

const EMERALD = "#10B981";

export function SpendTrendChart({
  points,
  currency,
}: {
  points: Point[];
  currency: string;
}) {
  if (points.length === 0) {
    return <div className="text-sm text-muted">No spending in this period.</div>;
  }

  const W = 320;
  const H = 120;
  const padT = 8;
  const padB = 22;
  const padL = 4;
  const padR = 4;
  const max = Math.max(1, ...points.map((p) => p.valueCents));
  const stepX = points.length > 1 ? (W - padL - padR) / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = padL + i * stepX;
    const y = padT + (1 - p.valueCents / max) * (H - padT - padB);
    return { x, y, ...p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x},${c.y}`).join(" ");
  const areaPath =
    `M ${coords[0].x},${H - padB} ` +
    coords.map((c) => `L ${c.x},${c.y}`).join(" ") +
    ` L ${coords[coords.length - 1].x},${H - padB} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full"
      preserveAspectRatio="none"
      aria-label="Spending trend"
    >
      <defs>
        <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={EMERALD} stopOpacity="0.45" />
          <stop offset="100%" stopColor={EMERALD} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#trend-fill)" />
      <path
        d={linePath}
        stroke={EMERALD}
        strokeWidth="2.5"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {coords.map((c) => (
        <circle key={c.label} cx={c.x} cy={c.y} r="2.5" fill={EMERALD}>
          <title>{`${c.label}: ${format(c.valueCents, currency)}`}</title>
        </circle>
      ))}
      {coords.map((c, i) => {
        if (i !== 0 && i !== coords.length - 1) return null;
        return (
          <text
            key={`label-${i}`}
            x={c.x}
            y={H - 6}
            textAnchor={i === 0 ? "start" : "end"}
            className="fill-current text-muted"
            fontSize="9"
          >
            {c.label}
          </text>
        );
      })}
    </svg>
  );
}

function format(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}
