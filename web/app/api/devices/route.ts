import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const credentialID = new URL(req.url).searchParams.get("id");
  if (!credentialID) return NextResponse.json({ error: "missing id" }, { status: 400 });

  // Scope by userId so a user can only delete their own authenticators.
  const result = await prisma.authenticator.deleteMany({
    where: { userId: session.user.id, credentialID },
  });
  if (result.count === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
