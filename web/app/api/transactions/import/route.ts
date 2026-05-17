import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { callApi } from "@/lib/apiClient";

function rowHash(accountId: string, r: { date: string; amountCents: number; description: string }): string {
  const key = [accountId, r.date, r.amountCents, r.description.trim().toLowerCase()].join("|");
  return createHash("sha256").update(key).digest("hex").slice(0, 32);
}

// Bank-exported "categories" that are really placeholders meaning "uncategorized".
// We strip these so the LLM can assign a real category.
const WEAK_CATEGORIES = new Set([
  "divers", "other", "others", "uncategorized", "uncategorised",
  "misc", "miscellaneous", "n/a", "na", "none", "unknown",
  "autres", "autre", "varios", "vario", "overig", "sonstiges",
]);

function meaningfulCategory(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (WEAK_CATEGORIES.has(trimmed.toLowerCase())) return undefined;
  return trimmed;
}

export const runtime = "nodejs";

const Body = z.object({
  accountId: z.string(),
  rows: z
    .array(
      z.object({
        date: z.string(),           // ISO 8601
        amountCents: z.number().int(),
        description: z.string().min(1),
        merchant: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .min(1)
    .max(5000),
});

type CategorizeResp = { categories: { external_id: string; category: string; confidence: number }[] };

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { accountId, rows } = parsed.data;
  const account = await prisma.bankAccount.findFirst({
    where: { id: accountId, userId: session.user.id },
  });
  if (!account) return NextResponse.json({ error: "account not found" }, { status: 404 });

  let inserted = 0;
  let skipped = 0;
  const newlyInserted: { external_id: string; merchant: string; amount_cents: number }[] = [];

  // Sequential inserts using the (accountId, externalId) unique constraint for dedup.
  for (const r of rows) {
    const externalId = rowHash(accountId, r);
    const category = meaningfulCategory(r.category);
    try {
      const txn = await prisma.transaction.create({
        data: {
          userId: session.user.id,
          accountId,
          externalId,
          amountCents: BigInt(r.amountCents),
          currency: account.currency,
          description: r.description,
          merchant: r.merchant ?? null,
          category: category ?? null,
          postedAt: new Date(r.date),
        },
      });
      inserted++;
      if (!category) {
        newlyInserted.push({
          external_id: txn.externalId,
          merchant: r.merchant ?? r.description,
          amount_cents: r.amountCents,
        });
      }
    } catch (e: unknown) {
      // Unique constraint = duplicate row, skip silently.
      if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002") {
        skipped++;
        continue;
      }
      throw e;
    }
  }

  // Best-effort categorization for rows the user didn't pre-categorize.
  if (newlyInserted.length > 0) {
    try {
      const customCats = await prisma.customCategory.findMany({
        where: { userId: session.user.id },
        select: { name: true },
      });
      const res = await callApi<CategorizeResp>("/categorize", {
        transactions: newlyInserted,
        extra_categories: customCats.map((c) => c.name),
      });
      for (const c of res.categories) {
        await prisma.transaction.updateMany({
          where: { accountId, externalId: c.external_id },
          data: { category: c.category, categoryConfidence: c.confidence },
        });
      }
    } catch {
      // Categorization is non-blocking — transactions are stored either way.
    }
  }

  return NextResponse.json({ inserted, skipped });
}
