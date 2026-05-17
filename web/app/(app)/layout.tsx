import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/sign-in");

  return (
    <div className="lg:flex lg:min-h-screen">
      <SideNav />
      <main className="mx-auto w-full max-w-md pb-20 lg:mx-0 lg:max-w-none lg:flex-1 lg:pb-0">
        <div className="lg:mx-auto lg:max-w-5xl lg:py-6">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
