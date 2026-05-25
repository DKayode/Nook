import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const UpsertBody = z.object({
  category: z.string().trim().min(1).max(60),
  monthlyLimitCents: z.number().int().nonnegative(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = UpsertBody.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { category, monthlyLimitCents } = parsed.data;

  const budget = await prisma.budget.upsert({
    where: { userId_category: { userId: session.user.id, category } },
    update: { monthlyLimitCents: BigInt(monthlyLimitCents) },
    create: {
      userId: session.user.id,
      category,
      monthlyLimitCents: BigInt(monthlyLimitCents),
    },
  });

  return NextResponse.json({
    budget: {
      id: budget.id,
      category: budget.category,
      monthlyLimitCents: Number(budget.monthlyLimitCents),
    },
  });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const category = new URL(req.url).searchParams.get("category");
  if (!category) return NextResponse.json({ error: "missing category" }, { status: 400 });

  const result = await prisma.budget.deleteMany({
    where: { userId: session.user.id, category },
  });
  if (result.count === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
