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

  // Sum transaction amounts per account so we can show current balance = initial + sum.
  const sums = await prisma.transaction.groupBy({
    by: ["accountId"],
    where: { userId },
    _sum: { amountCents: true },
  });
  const sumByAccount = new Map(sums.map((s) => [s.accountId, Number(s._sum.amountCents ?? 0)]));

  return (
    <main className="px-5 pt-12 lg:pt-0">
      <h1 className="text-2xl font-semibold">Accounts</h1>
      <p className="mt-1 text-sm text-muted">Each account is a place transactions live (Checking, Visa, …).</p>

      <div className="mt-6">
        <AccountForm />
      </div>

      <div className="mt-6">
        <Link
          href="/import"
          className="block w-full rounded-xl bg-surface px-4 py-3 text-center text-sm font-medium ring-1 ring-white/10 active:scale-[0.99]"
        >
          Import transactions from CSV
        </Link>
      </div>

      <ul className="mt-8 space-y-2">
        {accounts.length === 0 && (
          <li className="rounded-xl bg-surface p-4 text-sm text-muted">No accounts yet.</li>
        )}
        {accounts.map((a) => {
          const current = Number(a.initialBalanceCents) + (sumByAccount.get(a.id) ?? 0);
          return (
            <li key={a.id} className="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
              <div>
                <div className="text-base">{a.name}</div>
                <div className="text-xs text-muted">
                  {a.type ?? "account"} · {a._count.transactions} transactions
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="font-medium">{format(current, a.currency)}</div>
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
