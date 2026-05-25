"use client";

import Link from "next/link";

type Props = {
  userName: string | null;
  userEmail: string | null;
  notificationCount: number;
};

function firstNameOf(name: string | null, email: string | null): string {
  if (name && name.trim()) return name.trim().split(/\s+/)[0];
  if (email) return email.split("@")[0];
  return "Guest";
}

function acronymOf(name: string | null, fallback: string): string {
  const source = name && name.trim() ? name.trim() : fallback;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source[0]?.toUpperCase() ?? "?";
}

export function TopHeader({ userName, userEmail, notificationCount }: Props) {
  const first = firstNameOf(userName, userEmail);
  const initials = acronymOf(userName, first);
  return (
    <header className="sticky top-0 z-40 grid grid-cols-3 items-center border-b border-border bg-bg/95 px-4 py-3 backdrop-blur">
      <div className="flex justify-start">
        <Link
          href="/accounts"
          aria-label="Profile and accounts"
          className="flex items-center gap-2 rounded-full bg-surface px-2 py-1.5 text-sm text-ink ring-1 ring-border transition hover:bg-surface-2"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-ink font-medium text-bg">
            {initials}
          </span>
          <span className="max-w-[8rem] truncate font-medium">{first}</span>
        </Link>
      </div>

      <div className="flex justify-center">
        <span className="font-display text-xl font-bold tracking-tight text-ink">
          Nook
        </span>
      </div>

      <div className="flex justify-end">
        <Link
          href="/?tab=home&filter=uncategorized"
          aria-label={`${notificationCount} item${notificationCount === 1 ? "" : "s"} need attention`}
          className="relative flex size-9 items-center justify-center rounded-full bg-surface text-ink ring-1 ring-border transition hover:bg-surface-2"
        >
          <BellIcon />
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-bg">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
