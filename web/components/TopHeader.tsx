"use client";

import Link from "next/link";

type Props = {
  userName: string | null;
  userEmail: string | null;
  notificationCount: number;
};

// 1–2 letter glyph for the avatar. Uses the user's first name when available
// (D for "Damien", DK for "Damien Kabashima"); falls back to the first letter
// of the email username when no name is set.
function initialsOf(name: string | null, email: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

export function TopHeader({ userName, userEmail, notificationCount }: Props) {
  const initials = initialsOf(userName, userEmail);
  return (
    <header className="sticky top-0 z-40 grid grid-cols-3 items-center border-b border-border bg-bg/95 px-4 py-3 backdrop-blur">
      <div className="flex justify-start">
        <Link
          href="/accounts"
          aria-label={`Profile and accounts (${userName || userEmail || "Guest"})`}
          title={userName || userEmail || "Guest"}
          className="flex size-9 items-center justify-center rounded-full border border-border bg-ink text-bg transition hover:opacity-90"
        >
          <span className="text-xs font-semibold tracking-tight">{initials}</span>
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
          className="relative flex size-9 items-center justify-center rounded-full border border-border bg-bg text-ink transition hover:bg-surface"
        >
          <BellIcon />
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full border border-bg bg-ink px-1 text-[10px] font-bold text-bg">
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
