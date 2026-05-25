// Stark monochrome SPLIT chip for transactions that have at least one Split row.
// Variant `solid` is white-on-black (against a light/neutral surface); `outline` is
// black-on-white with a 1px border (against a dark canvas). No color accent — the
// design system reserves the accent for chart data + balance highlights only.

type Props = {
  variant?: "solid" | "outline";
  className?: string;
};

export function SplitBadge({ variant = "outline", className = "" }: Props) {
  const base = "inline-flex items-center rounded-sm px-1.5 py-px text-[10px] font-bold uppercase tracking-[0.12em]";
  const tone =
    variant === "solid"
      ? "bg-ink text-bg"
      : "border border-ink bg-bg text-ink";
  return (
    <span className={`${base} ${tone} ${className}`} aria-label="Split transaction">
      Split
    </span>
  );
}
