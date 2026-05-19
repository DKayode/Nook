"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Home" },
  { href: "/transactions", label: "Activity" },
  { href: "/categories", label: "Tags" },
  { href: "/accounts", label: "Accounts" },
  { href: "/settings", label: "Settings" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-bg/90 backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-md justify-around px-4 py-3 text-sm">
        {items.map((it) => {
          const active = pathname === it.href || pathname?.startsWith(it.href + "/");
          return (
            <li key={it.href}>
              <Link href={it.href} className={active ? "text-white" : "text-muted hover:text-white"}>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
