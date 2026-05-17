import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const Body = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(["checking", "savings", "credit", "cash", "other"]).default("checking"),
  currency: z.string().trim().length(3).toUpperCase().default("EUR"),
  initialBalanceCents: z.number().int().default(0),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const account = await prisma.bankAccount.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      type: parsed.data.type,
      currency: parsed.data.currency,
      initialBalanceCents: BigInt(parsed.data.initialBalanceCents),
    },
  });

  return NextResponse.json(
    { account: { ...account, initialBalanceCents: Number(account.initialBalanceCents) } },
    { status: 201 }
  );
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const result = await prisma.bankAccount.deleteMany({ where: { id, userId: session.user.id } });
  if (result.count === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
