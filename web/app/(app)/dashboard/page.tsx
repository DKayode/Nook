import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { callApi } from "@/lib/apiClient";
import { DailySpendChart } from "@/components/DailySpendChart";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { InOutSummary } from "@/components/InOutSummary";
import { DateRangePicker } from "@/components/DateRangePicker";
import { MonthlyComparison } from "@/components/MonthlyComparison";

type Forecast = {
  min_projected_cents: number;
  min_projected_date: string;
  alert: null | { type: "LOW_BALANCE_FORECAST"; message: string };
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(s: string | undefined): Date | null {
  if (!s || !ISO_DATE.test(s)) return null;
  const d = new Date(s + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const session = await auth();
  const userId = session!.user!.id!;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const defaultFrom = new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate() - 29);

  let from = parseDate(searchParams.from) ?? defaultFrom;
  let to = parseDate(searchParams.to) ?? todayStart;
  if (from > to) [from, to] = [to, from];

  // End-of-day on `to` so we include all of it.
  const windowEnd = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
  const dayCount = Math.round((to.getTime() - from.getTime()) / (24 * 3600_000)) + 1;

  const accounts = await prisma.bankAccount.findMany({ where: { userId } });

  // Last 6 months (current month + 5 prior) for the monthly comparison — independent of the picker.
  const MONTHS_BACK = 6;
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - (MONTHS_BACK - 1), 1);

  const [txnSums, windowTxns, monthlyTxns] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["accountId"],
      where: { userId },
      _sum: { amountCents: true },
    }),
    prisma.transaction.findMany({
      where: { userId, postedAt: { gte: from, lte: windowEnd } },
      orderBy: { postedAt: "asc" },
    }),
    prisma.transaction.findMany({
      where: { userId, postedAt: { gte: sixMonthsAgo } },
      select: { amountCents: true, postedAt: true },
    }),
  ]);

  // Zero-fill months so empty months still appear in the chart.
  const monthBuckets = new Map<string, { incomeCents: number; expenseCents: number; label: string }>();
  for (let i = MONTHS_BACK - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthBuckets.set(key, {
      incomeCents: 0,
      expenseCents: 0,
      label: d.toLocaleDateString(undefined, { month: "short" }),
    });
  }
  for (const t of monthlyTxns) {
    const k = `${t.postedAt.getFullYear()}-${String(t.postedAt.getMonth() + 1).padStart(2, "0")}`;
    const bucket = monthBuckets.get(k);
    if (!bucket) continue;
    const amt = Number(t.amountCents);
    if (amt >= 0) bucket.incomeCents += amt;
    else bucket.expenseCents += -amt;
  }
  const monthlyData = Array.from(monthBuckets.entries()).map(([key, v]) => ({ key, ...v }));

  const sumByAccount = new Map(txnSums.map((s) => [s.accountId, Number(s._sum.amountCents ?? 0)]));
  const totalBalanceCents = accounts.reduce(
    (s, a) => s + Number(a.initialBalanceCents) + (sumByAccount.get(a.id) ?? 0),
    0
  );

  let incomeCents = 0;
  let expenseCents = 0;
  for (const t of windowTxns) {
    const amt = Number(t.amountCents);
    if (amt >= 0) incomeCents += amt;
    else expenseCents += -amt;
  }

  const dayBuckets = new Map<string, number>();
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    dayBuckets.set(fmtISO(d), 0);
  }
  for (const t of windowTxns) {
    const amt = Number(t.amountCents);
    if (amt >= 0) continue;
    const key = fmtISO(t.postedAt);
    if (dayBuckets.has(key)) dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + -amt);
  }
  const days = Array.from(dayBuckets.entries()).map(([date, spendCents]) => ({ date, spendCents }));

  const catBuckets = new Map<string, number>();
  for (const t of windowTxns) {
    const amt = Number(t.amountCents);
    if (amt >= 0) continue;
    const cat = t.category ?? "Uncategorized";
    catBuckets.set(cat, (catBuckets.get(cat) ?? 0) + -amt);
  }
  const categoryRows = Array.from(catBuckets.entries()).map(([category, spendCents]) => ({
    category,
    spendCents,
  }));

  let forecast: Forecast | null = null;
  if (accounts.length > 0 && windowTxns.length > 0) {
    try {
      forecast = await callApi<Forecast>("/forecast", {
        balance_cents: totalBalanceCents,
        transactions: windowTxns.map((t) => ({
          amount_cents: Number(t.amountCents),
          posted_at: t.postedAt.toISOString(),
          merchant: t.merchant ?? t.description,
        })),
        horizon_days: 30,
      });
    } catch {
      forecast = null;
    }
  }

  const currency = accounts[0]?.currency ?? "EUR";
  const rangeLabel = `${from.toLocaleDateString()} – ${to.toLocaleDateString()}`;

  return (
    <main className="space-y-4 px-5 pt-12 lg:pt-0">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold lg:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            {rangeLabel} · {accounts.length} account{accounts.length === 1 ? "" : "s"}
          </p>
        </div>
        <DateRangePicker from={fmtISO(from)} to={fmtISO(to)} />
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-surface p-5 lg:col-span-1">
          <div className="text-xs uppercase tracking-wide text-muted">Total balance</div>
          <div className="mt-1 text-4xl font-semibold">{format(totalBalanceCents, currency)}</div>
        </div>
        <div className="lg:col-span-2">
          <InOutSummary incomeCents={incomeCents} expenseCents={expenseCents} currency={currency} />
        </div>
      </div>

      {forecast?.alert && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="text-sm font-medium text-red-300">Heads up</div>
          <div className="mt-1 text-sm">{forecast.alert.message}</div>
          <div className="mt-2 text-xs text-muted">
            Projected low: {format(forecast.min_projected_cents, currency)} on{" "}
            {new Date(forecast.min_projected_date).toLocaleDateString()}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DailySpendChart days={days} currency={currency} label={rangeLabel} />
        <CategoryBreakdown rows={categoryRows} currency={currency} />
      </div>

      <MonthlyComparison months={monthlyData} currency={currency} />

      <div className="grid grid-cols-2 gap-3 pt-2 lg:max-w-md">
        <Link
          href="/accounts"
          className="rounded-xl bg-surface px-4 py-3 text-center text-sm ring-1 ring-white/10 active:scale-[0.99]"
        >
          Manage accounts
        </Link>
        <Link
          href="/import"
          className="rounded-xl bg-accent px-4 py-3 text-center text-sm font-medium text-white active:scale-[0.99]"
        >
          Import CSV
        </Link>
      </div>
    </main>
  );
}

function format(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}
