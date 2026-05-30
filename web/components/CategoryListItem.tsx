"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryIconPicker } from "@/components/CategoryIconPicker";
import { DEFAULT_CATEGORY_ICON } from "@/lib/categoryIcons";

type Props = {
  id: string;
  name: string;
  icon: string | null;
};

export function CategoryListItem({ id, name, icon }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [draftName, setDraftName] = useState(name);
  const [draftIcon, setDraftIcon] = useState<string>(icon ?? DEFAULT_CATEGORY_ICON);

  async function save() {
    const trimmed = draftName.trim();
    if (!trimmed) {
      setErr("Name is required.");
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed, icon: draftIcon }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setErr(typeof body.error === "string" ? body.error : "Couldn't save.");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Delete category "${name}"? Transactions tagged with it stay but lose the label.`)) return;
    setBusy(true);
    await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <li className="flex items-center justify-between rounded-2xl border border-border bg-bg px-4 py-3">
        <span className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">
            {icon ?? DEFAULT_CATEGORY_ICON}
          </span>
          <span>{name}</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted hover:bg-surface hover:text-ink"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="rounded-full border border-border-2 px-2 py-0.5 text-[10px] uppercase tracking-wide text-ink hover:bg-surface disabled:opacity-60"
          >
            Remove
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="space-y-3 rounded-2xl border border-ink bg-bg px-4 py-4">
      <div className="flex items-stretch gap-2">
        <div
          className="flex aspect-square w-12 shrink-0 items-center justify-center rounded-2xl border border-border text-xl"
          aria-hidden="true"
        >
          {draftIcon}
        </div>
        <input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          maxLength={40}
          className="w-full rounded-2xl border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        />
      </div>
      <CategoryIconPicker value={draftIcon} onChange={setDraftIcon} />
      {err && <div className="text-xs text-ink">{err}</div>}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setEditing(false);
            setDraftName(name);
            setDraftIcon(icon ?? DEFAULT_CATEGORY_ICON);
            setErr(null);
          }}
          className="rounded-2xl border border-border bg-bg px-3 py-2 text-xs text-muted hover:bg-surface-2 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="rounded-2xl border border-ink bg-ink px-3 py-2 text-xs font-medium text-bg disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </li>
  );
}
