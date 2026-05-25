"use client";

import { CATEGORY_ICON_CHOICES } from "@/lib/categoryIcons";

type Props = {
  value: string;
  onChange: (next: string) => void;
};

export function CategoryIconPicker({ value, onChange }: Props) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted">Icon</div>
      <div className="mt-2 grid grid-cols-10 gap-1.5">
        {CATEGORY_ICON_CHOICES.map((g) => {
          const selected = g === value;
          return (
            <button
              key={g}
              type="button"
              onClick={() => onChange(g)}
              aria-pressed={selected}
              aria-label={`Pick ${g}`}
              className={`flex aspect-square items-center justify-center rounded-lg text-lg transition ${
                selected
                  ? "bg-ink text-bg ring-2 ring-ink"
                  : "bg-surface ring-1 ring-border hover:bg-surface-2"
              }`}
            >
              <span>{g}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
