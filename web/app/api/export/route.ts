import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const [accounts, transactions, customCategories, splits] = await Promise.all([
    prisma.bankAccount.findMany({ where: { userId } }),
    prisma.transaction.findMany({ where: { userId } }),
    prisma.customCategory.findMany({ where: { userId } }),
    prisma.split.findMany({
      where: { transaction: { userId } },
      include: { participants: true },
    }),
  ]);

  // BigInt → number for JSON, since BigInt isn't serializable natively.
  const replacer = (_: string, v: unknown) => (typeof v === "bigint" ? Number(v) : v);

  const body = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      schemaVersion: 1,
      accounts,
      transactions,
      customCategories,
      splits,
    },
    replacer,
    2,
  );

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="nook-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
