import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SideNav } from "@/components/SideNav";
import { MobileBottomNavLinks } from "@/components/MobileBottomNavLinks";
import { TopHeader } from "@/components/TopHeader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const userId = session.user.id;
  const [user, uncatCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
    prisma.transaction.count({
      where: { userId, OR: [{ category: null }, { category: "Uncategorized" }] },
    }),
  ]);

  return (
    <div className="lg:flex lg:min-h-screen">
      <SideNav />
      <main className="mx-auto w-full max-w-md pb-28 lg:mx-0 lg:max-w-none lg:flex-1 lg:pb-0">
        <TopHeader
          userName={user?.name ?? null}
          userEmail={user?.email ?? null}
          notificationCount={uncatCount}
        />
        <div className="px-4 pt-4 lg:mx-auto lg:max-w-5xl lg:py-6">
          {children}
        </div>
      </main>
      <MobileBottomNavLinks activeOverride="settings" />
    </div>
  );
}
