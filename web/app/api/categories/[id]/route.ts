import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const Body = z
  .object({
    name: z.string().trim().min(1).max(40).optional(),
    icon: z.string().trim().min(1).max(8).nullable().optional(),
  })
  .refine((b) => Object.keys(b).length > 0, { message: "no fields to update" });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Load the existing row first — we need the old name to cascade renames into Transaction
  // rows that pointed at it (Category is a free-form string on Transaction, not a FK).
  const existing = await prisma.customCategory.findFirst({
    where: { id: params.id, userId },
  });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const renaming = parsed.data.name !== undefined && parsed.data.name !== existing.name;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.customCategory.update({
        where: { id: existing.id },
        data: {
          ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
          ...(parsed.data.icon !== undefined ? { icon: parsed.data.icon } : {}),
        },
      });
      if (renaming) {
        await tx.transaction.updateMany({
          where: { userId, category: existing.name },
          data: { category: parsed.data.name! },
        });
        await tx.budget.updateMany({
          where: { userId, category: existing.name },
          data: { category: parsed.data.name! },
        });
      }
    });
  } catch (e: unknown) {
    if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "category already exists" }, { status: 409 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}
