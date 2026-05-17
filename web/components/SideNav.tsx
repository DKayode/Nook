"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Home" },
  { href: "/transactions", label: "Activity" },
  { href: "/categories", label: "Tags" },
  { href: "/accounts", label: "Accounts" },
  { href: "/import", label: "Import" },
];

export function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-white/10 lg:bg-surface/30">
      <div className="flex h-16 items-center px-6 text-base font-semibold">Expense</div>
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {items.map((it) => {
            const active = pathname === it.href || pathname?.startsWith(it.href + "/");
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={`block rounded-lg px-3 py-2 text-sm ${
                    active ? "bg-accent text-white" : "text-muted hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
