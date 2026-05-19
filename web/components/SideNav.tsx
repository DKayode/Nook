"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const primary = [
  { href: "/dashboard", label: "Home" },
  { href: "/transactions", label: "Activity" },
  { href: "/categories", label: "Tags" },
  { href: "/accounts", label: "Accounts" },
  { href: "/import", label: "Import" },
];

const secondary = [{ href: "/settings", label: "Settings" }];

export function SideNav() {
  const pathname = usePathname();
  function isActive(href: string) {
    return pathname === href || pathname?.startsWith(href + "/");
  }
  return (
    <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-white/10 lg:bg-surface/30">
      <div className="flex h-16 items-center px-6 text-base font-semibold">Nook</div>
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {primary.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`block rounded-lg px-3 py-2 text-sm ${
                  isActive(it.href) ? "bg-accent text-white" : "text-muted hover:bg-white/5 hover:text-white"
                }`}
              >
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <nav className="px-3 pb-4">
        <ul className="space-y-1 border-t border-white/10 pt-3">
          {secondary.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`block rounded-lg px-3 py-2 text-sm ${
                  isActive(it.href) ? "bg-accent text-white" : "text-muted hover:bg-white/5 hover:text-white"
                }`}
              >
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
