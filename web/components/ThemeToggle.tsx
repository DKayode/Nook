"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mode, setMode] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("nook-theme") : null;
    setMode(saved === "light" ? "light" : "dark");
  }, []);

  function flip() {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    try {
      localStorage.setItem("nook-theme", next);
    } catch {}
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  const isDark = mode === "dark";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={flip}
      className="flex w-full items-center justify-between rounded-2xl bg-surface px-4 py-3 text-left shadow-soft"
    >
      <div>
        <div className="text-sm font-medium">Dark mode</div>
        <div className="text-xs text-muted">
          {isDark ? "Dark theme — easy on the eyes at night" : "Light theme — bright daylight"}
        </div>
      </div>
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          isDark ? "bg-ink" : "bg-surface-2"
        }`}
      >
        <span
          className={`inline-block size-5 transform rounded-full bg-bg shadow transition ${
            isDark ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}
