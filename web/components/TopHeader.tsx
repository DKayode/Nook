"use client";

import Link from "next/link";

type Props = {
  userEmail: string | null;
  notificationCount: number;
};

export function TopHeader({ userEmail, notificationCount }: Props) {
  const initial = (userEmail ?? "?").trim()[0]?.toUpperCase() ?? "?";
  return (
    <header className="sticky top-0 z-40 grid grid-cols-3 items-center border-b border-forest-700/60 bg-bg/95 px-4 py-3 backdrop-blur ">
      <div className="flex justify-start">
        <Link
          href="/accounts"
          aria-label="Profile and accounts"
          className="flex items-center gap-2 rounded-full bg-gold/15 px-2 py-1.5 text-sm text-ink ring-1 ring-gold/30 transition hover:bg-gold/25"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-gold font-medium text-forest">
            {initial}
          </span>
          <span className="max-w-[8rem] truncate font-medium">{userEmail ?? "Guest"}</span>
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
          className="relative flex size-9 items-center justify-center rounded-full bg-gold/15 text-ink ring-1 ring-gold/30 transition hover:bg-gold/25"
        >
          <BellIcon />
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-forest">
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
