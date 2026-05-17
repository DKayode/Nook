export function InOutSummary({
  incomeCents,
  expenseCents,
  currency,
}: {
  incomeCents: number;
  expenseCents: number;
  currency: string;
}) {
  const net = incomeCents - expenseCents;
  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-surface p-4">
      <Cell label="In" value={incomeCents} currency={currency} positive />
      <Cell label="Out" value={-expenseCents} currency={currency} />
      <Cell label="Net" value={net} currency={currency} bold />
    </div>
  );
}

function Cell({
  label,
  value,
  currency,
  positive,
  bold,
}: {
  label: string;
  value: number;
  currency: string;
  positive?: boolean;
  bold?: boolean;
}) {
  const color = value >= 0 ? "text-emerald-400" : "text-white";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-1 ${bold ? "text-lg font-semibold" : "text-base"} ${positive ? "text-emerald-400" : color}`}>
        {new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(value / 100)}
      </div>
    </div>
  );
}
