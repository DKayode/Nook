"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TABS, type TabKey } from "@/lib/tabs";

// Sub-pages (/accounts, /categories, /import, /devices) render this Link-driven copy of
// the bottom nav so the bar looks identical no matter where the user is. Each tab
// navigates back to "/?tab=<key>" so the AppShell on home opens straight to that view.
// `activeOverride` lets a sub-page mark which tab is "current" — e.g. /accounts feels like
// a Settings sub-page.

export function MobileBottomNavLinks({ activeOverride }: { activeOverride?: TabKey }) {
  const pathname = usePathname();
  const active: TabKey | null =
    activeOverride ??
    (pathname === "/" || pathname?.startsWith("/dashboard") ? "home" : null);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 gap-1 px-3 pb-2 pt-2">
        {TABS.map((t) => {
          const isActive = t.key === active;
          const isAddTab = t.key === "add";
          return (
            <li key={t.key}>
              <Link
                href={`/?tab=${t.key}`}
                aria-current={isActive ? "page" : undefined}
                aria-label={t.label}
                title={t.label}
                className="flex w-full flex-col items-center justify-center gap-0.5"
              >
                <span
                  className={
                    isAddTab
                      ? "flex size-12 -translate-y-3 items-center justify-center rounded-full border border-border bg-ink text-bg transition hover:scale-105"
                      : `flex size-10 items-center justify-center rounded-2xl border transition ${
                          isActive
                            ? "border-ink bg-surface text-ink"
                            : "border-transparent text-muted"
                        }`
                  }
                >
                  {t.icon}
                </span>
                {!isAddTab && (
                  <span
                    className={`text-[10px] font-medium uppercase tracking-wide ${
                      isActive ? "text-ink" : "text-muted"
                    }`}
                  >
                    {t.label}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
