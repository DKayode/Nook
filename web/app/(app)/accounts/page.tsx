import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AccountForm } from "@/components/AccountForm";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";

export default async function AccountsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const accounts = await prisma.bankAccount.findMany({
    where: { userId },
    include: { _count: { select: { transactions: true } } },
    orderBy: { createdAt: "desc" },
  });

  const sums = await prisma.transaction.groupBy({
    by: ["accountId"],
    where: { userId },
    _sum: { amountCents: true },
  });
  const sumByAccount = new Map(sums.map((s) => [s.accountId, Number(s._sum.amountCents ?? 0)]));

  return (
    <main className="animate-fade-in space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold">Accounts</h1>
        <p className="mt-1 text-sm text-muted">
          Each account is a place transactions live (Checking, Visa, …).
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-bg p-5">
        <AccountForm />
      </section>

      <Link
        href="/import"
        className="block rounded-2xl border border-dashed border-border bg-bg px-5 py-4 text-center text-sm font-medium text-ink transition hover:bg-surface"
      >
        Import transactions from CSV
      </Link>

      <ul className="space-y-2">
        {accounts.length === 0 && (
          <li className="rounded-2xl border border-border bg-bg p-4 text-sm text-muted">
            No accounts yet.
          </li>
        )}
        {accounts.map((a) => {
          const current = Number(a.initialBalanceCents) + (sumByAccount.get(a.id) ?? 0);
          return (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-bg px-4 py-3"
            >
              <div>
                <div className="text-base font-medium">{a.name}</div>
                <div className="text-xs text-muted">
                  {a.type ?? "account"} · {a._count.transactions} transactions
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="font-medium tabular-nums">{format(current, a.currency)}</div>
                <DeleteAccountButton id={a.id} name={a.name} />
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function format(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}
