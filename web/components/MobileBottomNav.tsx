"use client";

import type { TabKey } from "@/components/AppShell";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "home", label: "Home", icon: <HomeIcon /> },
  { key: "analytics", label: "Analytics", icon: <ChartIcon /> },
  { key: "add", label: "Add", icon: <PlusIcon /> },
  { key: "settings", label: "Settings", icon: <CogIcon /> },
];

export function MobileBottomNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (k: TabKey) => void;
}) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-forest-700/60 bg-bg/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-4 gap-1 px-3 pb-2 pt-2">
        {TABS.map((t) => {
          const isActive = t.key === active;
          const isAddTab = t.key === "add";
          return (
            <li key={t.key}>
              <button
                type="button"
                onClick={() => onChange(t.key)}
                aria-current={isActive ? "page" : undefined}
                aria-label={t.label}
                className={
                  isAddTab
                    ? "flex w-full flex-col items-center justify-center gap-0.5"
                    : "flex w-full flex-col items-center justify-center gap-0.5"
                }
              >
                <span
                  className={
                    isAddTab
                      ? `flex size-12 -translate-y-3 items-center justify-center rounded-full shadow-soft transition ${
                          isActive ? "bg-gold text-forest" : "bg-gold text-forest hover:scale-105"
                        }`
                      : `flex size-10 items-center justify-center rounded-2xl transition ${
                          isActive ? "bg-gold/20 text-gold" : "text-muted"
                        }`
                  }
                >
                  {t.icon}
                </span>
                <span
                  className={`text-[10px] font-medium uppercase tracking-wide ${
                    isAddTab ? "-mt-2" : ""
                  } ${isActive && !isAddTab ? "text-gold" : "text-muted"}`}
                >
                  {t.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
      <path d="M4 20V8M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-6">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
function CogIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}
