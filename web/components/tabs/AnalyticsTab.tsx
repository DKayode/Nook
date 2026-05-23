"use client";

import { useMemo, useState } from "react";
import { CategoryPieChart } from "@/components/CategoryPieChart";
import { SpendTrendChart } from "@/components/SpendTrendChart";

export type Window = "1m" | "3m" | "1y";

export type AnalyticsTabData = {
  currency: string;
  // For each window, pre-aggregated category spend + a trend series.
  windows: Record<
    Window,
    {
      categories: { category: string; spendCents: number }[];
      trend: { label: string; valueCents: number }[];
      totalCents: number;
    }
  >;
};

const FILTERS: { key: Window; label: string }[] = [
  { key: "1m", label: "1 Month" },
  { key: "3m", label: "3 Months" },
  { key: "1y", label: "1 Year" },
];

export function AnalyticsTab({ data }: { data: AnalyticsTabData }) {
  const [active, setActive] = useState<Window>("1m");
  const w = data.windows[active];

  // Memoize so re-renders on toggle don't recompute pie chart slice colors.
  const categories = useMemo(() => w.categories, [w]);

  return (
    <div className="animate-fade-in space-y-4">
      {/* Filter pills */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Analytics</h2>
        <div role="tablist" className="inline-flex rounded-full bg-surface p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={active === f.key}
              onClick={() => setActive(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active === f.key
                  ? "bg-gold text-forest shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pie */}
      <CategoryPieChart rows={categories} currency={data.currency} />

      {/* Trend area chart */}
      <section className="rounded-3xl bg-surface p-5 shadow-soft">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted">
              Spending trend
            </div>
            <div className="mt-1 font-display text-2xl font-semibold tabular-nums">
              {new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: data.currency,
                maximumFractionDigits: 0,
              }).format(w.totalCents / 100)}
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-wide text-gold">
            {FILTERS.find((f) => f.key === active)?.label}
          </span>
        </div>
        <div className="mt-3">
          <SpendTrendChart points={w.trend} currency={data.currency} />
        </div>
      </section>
    </div>
  );
}
