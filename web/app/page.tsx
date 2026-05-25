import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell, type ShellData, type TabKey } from "@/components/AppShell";
import type { BudgetRow } from "@/components/tabs/BudgetTab";

const BUILTIN_CATEGORIES = ["Income", "Food", "Transport", "Bills", "Shopping", "Uncategorized"];

export default async function HomePage({ searchParams }: { searchParams: { tab?: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const userId = session.user.id;

  const now = new Date();
  const monthStart = startOfMonthsAgo(now, 0);
  const threeMonthsStart = startOfMonthsAgo(now, 2);
  const oneYearStart = startOfMonthsAgo(now, 11);

  const [user, accounts, txnSums, recent, yearTxns, customCategories, txnCount, uncatCount, budgets] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
      prisma.bankAccount.findMany({ where: { userId } }),
      prisma.transaction.groupBy({
        by: ["accountId"],
        where: { userId },
        _sum: { amountCents: true },
      }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { postedAt: "desc" },
        take: 10,
        select: {
          id: true,
          description: true,
          amountCents: true,
          category: true,
          postedAt: true,
        },
      }),
      // A full year of transactions feeds the 1m / 3m / 1y analytics windows in one query.
      prisma.transaction.findMany({
        where: { userId, postedAt: { gte: oneYearStart } },
        select: { amountCents: true, postedAt: true, category: true },
      }),
      prisma.customCategory.findMany({
        where: { userId },
        select: { id: true, name: true, icon: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.transaction.count({ where: { userId } }),
      prisma.transaction.count({
        where: { userId, OR: [{ category: null }, { category: "Uncategorized" }] },
      }),
      prisma.budget.findMany({
        where: { userId },
        select: { category: true, monthlyLimitCents: true },
      }),
    ]);

  const currency = accounts[0]?.currency ?? "EUR";
  const sumByAccount = new Map(txnSums.map((s) => [s.accountId, Number(s._sum.amountCents ?? 0)]));
  const realBalanceCents = accounts.reduce(
    (s, a) => s + Number(a.initialBalanceCents) + (sumByAccount.get(a.id) ?? 0),
    0,
  );
  const sharedBalanceCents = 0; // placeholder until split-expenses lands

  // Home tab: current-month income / expense totals.
  let incomeCents = 0;
  let expenseCents = 0;
  const monthSpendByCategory = new Map<string, number>();
  for (const t of yearTxns) {
    if (t.postedAt < monthStart) continue;
    const amt = Number(t.amountCents);
    if (amt >= 0) {
      incomeCents += amt;
    } else {
      const spend = -amt;
      expenseCents += spend;
      const cat = t.category ?? "Uncategorized";
      monthSpendByCategory.set(cat, (monthSpendByCategory.get(cat) ?? 0) + spend);
    }
  }

  // Analytics tab: (categories, trend) per window.
  function aggregateWindow(from: Date, by: "day" | "week" | "month") {
    const inWindow = yearTxns.filter((t) => t.postedAt >= from && Number(t.amountCents) < 0);
    const categories = new Map<string, number>();
    const buckets = new Map<string, number>();
    let total = 0;
    for (const t of inWindow) {
      const amt = -Number(t.amountCents);
      total += amt;
      const cat = t.category ?? "Uncategorized";
      categories.set(cat, (categories.get(cat) ?? 0) + amt);
      buckets.set(bucketKey(t.postedAt, by), (buckets.get(bucketKey(t.postedAt, by)) ?? 0) + amt);
    }
    return {
      totalCents: total,
      categories: Array.from(categories, ([category, spendCents]) => ({ category, spendCents })),
      trend: zeroFillTrend(from, now, by, buckets),
    };
  }

  // Budget tab: union of every spendable category (built-ins + customs + anything with a budget)
  // alongside current-month spend and the budget cap if one exists.
  const customIconByName = new Map(customCategories.map((c) => [c.name, c.icon] as const));
  const limitByCategory = new Map(
    budgets.map((b) => [b.category, Number(b.monthlyLimitCents)] as const),
  );
  const budgetCategoryNames = new Set<string>([
    ...BUILTIN_CATEGORIES.filter((c) => c !== "Income"),
    ...customCategories.map((c) => c.name),
    ...budgets.map((b) => b.category),
  ]);
  const budgetRows: BudgetRow[] = Array.from(budgetCategoryNames)
    .map((category) => ({
      category,
      icon: customIconByName.get(category) ?? null,
      monthlyLimitCents: limitByCategory.has(category) ? limitByCategory.get(category)! : null,
      monthSpendCents: monthSpendByCategory.get(category) ?? 0,
    }))
    .sort((a, b) => {
      // Categories with a cap first (most relevant), then by current-month spend desc.
      const aHas = a.monthlyLimitCents != null ? 1 : 0;
      const bHas = b.monthlyLimitCents != null ? 1 : 0;
      if (aHas !== bHas) return bHas - aHas;
      return b.monthSpendCents - a.monthSpendCents;
    });

  const shellData: ShellData = {
    userName: user?.name ?? session.user.name ?? null,
    userEmail: user?.email ?? session.user.email ?? null,
    notificationCount: uncatCount,
    home: {
      currency,
      realBalanceCents,
      sharedBalanceCents,
      incomeCents,
      expenseCents,
      recent: recent.map((t) => ({
        id: t.id,
        description: t.description,
        amountCents: Number(t.amountCents),
        category: t.category,
        postedAt: t.postedAt.toISOString(),
      })),
    },
    analytics: {
      currency,
      windows: {
        "1m": aggregateWindow(monthStart, "day"),
        "3m": aggregateWindow(threeMonthsStart, "week"),
        "1y": aggregateWindow(oneYearStart, "month"),
      },
    },
    add: { customCategories, builtInCategories: BUILTIN_CATEGORIES },
    budget: { currency, rows: budgetRows },
    settings: {
      email: user?.email ?? null,
      accountCount: accounts.length,
      transactionCount: txnCount,
      customCategoryCount: customCategories.length,
    },
  };

  const validTabs: TabKey[] = ["home", "analytics", "add", "budget", "settings"];
  const initialTab = validTabs.includes(searchParams.tab as TabKey)
    ? (searchParams.tab as TabKey)
    : "home";

  return <AppShell data={shellData} initialTab={initialTab} />;
}

function startOfMonthsAgo(now: Date, monthsBack: number): Date {
  return new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
}

function bucketKey(d: Date, by: "day" | "week" | "month"): string {
  if (by === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  if (by === "week") {
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
  }
  return d.toISOString().slice(0, 10);
}

function zeroFillTrend(
  from: Date,
  to: Date,
  by: "day" | "week" | "month",
  filled: Map<string, number>,
) {
  const out: { label: string; valueCents: number }[] = [];
  const cursor = new Date(from);
  const seen = new Set<string>();
  while (cursor <= to) {
    const key = bucketKey(cursor, by);
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ label: labelFor(cursor, by), valueCents: filled.get(key) ?? 0 });
    }
    advance(cursor, by);
  }
  return out;
}

function labelFor(d: Date, by: "day" | "week" | "month"): string {
  if (by === "month") return d.toLocaleDateString(undefined, { month: "short" });
  if (by === "week") return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function advance(d: Date, by: "day" | "week" | "month") {
  if (by === "month") d.setMonth(d.getMonth() + 1);
  else if (by === "week") d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + 1);
}
