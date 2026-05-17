import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { callApi } from "@/lib/apiClient";

export const runtime = "nodejs";

type CategorizeResp = { categories: { external_id: string; category: string; confidence: number }[] };

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const txns = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    select: { externalId: true, merchant: true, description: true, amountCents: true },
  });
  if (txns.length === 0) return NextResponse.json({ updated: 0 });

  // Send everything in one batch — the FastAPI categorize endpoint dedups via rule pass first
  // and only LLM-categorizes the unmatched remainder.
  const payload = txns.map((t) => ({
    external_id: t.externalId,
    merchant: t.merchant ?? t.description,
    amount_cents: Number(t.amountCents),
  }));

  const customCats = await prisma.customCategory.findMany({
    where: { userId: session.user.id },
    select: { name: true },
  });
  const res = await callApi<CategorizeResp>("/categorize", {
    transactions: payload,
    extra_categories: customCats.map((c) => c.name),
  });

  let updated = 0;
  for (const c of res.categories) {
    const r = await prisma.transaction.updateMany({
      where: { userId: session.user.id, externalId: c.external_id },
      data: { category: c.category, categoryConfidence: c.confidence },
    });
    updated += r.count;
  }

  return NextResponse.json({ updated, total: txns.length });
}
