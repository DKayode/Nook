import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SignOutButton } from "@/components/SignOutButton";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [user, authenticatorCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
    prisma.authenticator.count({ where: { userId } }),
  ]);

  return (
    <main className="px-5 pt-12 lg:pt-0">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="mt-6 rounded-2xl bg-surface p-5">
        <div className="text-xs uppercase tracking-wide text-muted">Signed in as</div>
        <div className="mt-1 text-base">{user?.email}</div>
      </section>

      <section className="mt-4 rounded-2xl bg-surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-medium">Devices</div>
            <div className="mt-1 text-xs text-muted">
              {authenticatorCount === 0
                ? "No passkeys enrolled yet."
                : `${authenticatorCount} passkey${authenticatorCount === 1 ? "" : "s"} enrolled`}
            </div>
          </div>
          <Link href="/devices" className="text-sm text-accent hover:underline">
            Manage →
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <SignOutButton />
      </section>
    </main>
  );
}
