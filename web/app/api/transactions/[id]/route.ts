import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// All fields optional — the PATCH body is partial. `category` written via this endpoint
// also bumps confidence to 1.0 since the user is explicitly overriding the AI's guess.
const Body = z
  .object({
    description: z.string().trim().min(1).max(200).optional(),
    merchant: z.string().trim().max(120).nullable().optional(),
    category: z.string().trim().min(1).max(40).optional(),
    amountCents: z.number().int().optional(),
    postedAt: z.string().datetime().optional(),
  })
  .refine((b) => Object.keys(b).length > 0, { message: "no fields to update" });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.merchant !== undefined) data.merchant = parsed.data.merchant;
  if (parsed.data.category !== undefined) {
    data.category = parsed.data.category;
    data.categoryConfidence = 1.0;
  }
  if (parsed.data.amountCents !== undefined) data.amountCents = BigInt(parsed.data.amountCents);
  if (parsed.data.postedAt !== undefined) data.postedAt = new Date(parsed.data.postedAt);

  const result = await prisma.transaction.updateMany({
    where: { id: params.id, userId: session.user.id },
    data,
  });
  if (result.count === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await prisma.transaction.deleteMany({
    where: { id: params.id, userId: session.user.id },
  });
  if (result.count === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
