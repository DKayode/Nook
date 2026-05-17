import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TransactionRow } from "@/components/TransactionRow";

// Mirror of api/app/categorize.py ALLOWED — used as the base options in the picker.
const BUILTIN = ["Income", "Food", "Transport", "Bills", "Shopping", "Uncategorized"];

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; only?: string };
}) {
  const session = await auth();
  const userId = session!.user!.id!;
  const q = searchParams.q?.trim();
  const onlyUncat = searchParams.only === "uncategorized";

  const where: Parameters<typeof prisma.transaction.findMany>[0] = {
    where: {
      userId,
      ...(q
        ? {
            OR: [
              { merchant: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(onlyUncat
        ? { OR: [{ category: null }, { category: "Uncategorized" }] }
        : searchParams.category
        ? { category: searchParams.category }
        : {}),
    },
    orderBy: { postedAt: "desc" },
    take: 200,
  };

  const [txns, custom, uncatCount] = await Promise.all([
    prisma.transaction.findMany(where as never),
    prisma.customCategory.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.transaction.count({
      where: { userId, OR: [{ category: null }, { category: "Uncategorized" }] },
    }),
  ]);

  // Categories shown in the picker: built-ins + user's custom (de-duped, preserve order).
  const seen = new Set<string>();
  const categories: string[] = [];
  for (const c of [...BUILTIN, ...custom.map((c) => c.name)]) {
    if (!seen.has(c)) {
      seen.add(c);
      categories.push(c);
    }
  }

  return (
    <main className="pt-12 lg:pt-0">
      <div className="px-5">
        <h1 className="text-2xl font-semibold">Activity</h1>
        <form className="mt-4">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search merchant or description"
            className="w-full rounded-xl border border-white/10 bg-surface px-4 py-3 outline-none focus:border-accent"
          />
        </form>

        <div className="mt-3 flex gap-2 text-xs">
          <Link
            href="/transactions"
            className={`rounded-full px-3 py-1 ${!onlyUncat ? "bg-accent text-white" : "bg-surface text-muted"}`}
          >
            All
          </Link>
          <Link
            href="/transactions?only=uncategorized"
            className={`rounded-full px-3 py-1 ${
              onlyUncat
                ? "bg-amber-500/20 text-amber-300"
                : uncatCount > 0
                ? "bg-amber-500/10 text-amber-300"
                : "bg-surface text-muted"
            }`}
          >
            Uncategorized{uncatCount > 0 && ` · ${uncatCount}`}
          </Link>
        </div>
      </div>

      <div className="mt-4">
        {txns.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-muted">
            {onlyUncat ? "All categorized." : "No transactions yet."}
          </div>
        )}
        {txns.map((t) => (
          <TransactionRow
            key={t.id}
            id={t.id}
            merchant={t.merchant ?? t.description}
            category={t.category}
            amountCents={Number(t.amountCents)}
            currency={t.currency}
            postedAt={t.postedAt}
            categories={categories}
          />
        ))}
      </div>
    </main>
  );
}
