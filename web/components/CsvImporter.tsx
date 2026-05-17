"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import {
  detectColumns,
  isMappingValid,
  normalizeRow,
  type ColumnMapping,
  type ParsedRow,
} from "@/lib/csv";

type Account = { id: string; name: string; currency: string };
type RawRow = Record<string, string>;

type RowStatus =
  | { kind: "ok"; row: ParsedRow }
  | { kind: "error"; rawIndex: number; error: string };

type Stage = "pick" | "analyzing" | "ready" | "needs-help";

export function CsvImporter({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [stage, setStage] = useState<Stage>("pick");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [fileName, setFileName] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<"llm" | "fallback" | null>(null);
  const [showMapping, setShowMapping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const processed: RowStatus[] = useMemo(() => {
    if (!isMappingValid(mapping) || rawRows.length === 0) return [];
    return rawRows.map((r, i) => {
      const out = normalizeRow(r, mapping);
      return "error" in out
        ? { kind: "error", rawIndex: i, error: out.error }
        : { kind: "ok", row: out };
    });
  }, [rawRows, mapping]);

  const validRows = processed.filter((p): p is { kind: "ok"; row: ParsedRow } => p.kind === "ok");
  const errorRows = processed.filter((p): p is { kind: "error"; rawIndex: number; error: string } => p.kind === "error");
  const account = accounts.find((a) => a.id === accountId);

  function reset() {
    setStage("pick");
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setFileName(null);
    setAiSource(null);
    setShowMapping(false);
    setErr(null);
    setResult(null);
  }

  function onFile(file: File) {
    setErr(null);
    setResult(null);
    setFileName(file.name);
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setShowMapping(false);
    setAiSource(null);
    setStage("analyzing");

    // Parse without a header row first so we can decide whether the file even has one.
    // Many bank CSVs (especially French) export raw rows with no header.
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      delimitersToGuess: [",", ";", "\t", "|"],
      complete: async (rawResults) => {
        const fatal = rawResults.errors.find((e) => e.type === "Delimiter" || e.code === "MissingQuotes");
        if (fatal) {
          setErr(`Couldn't read the file: ${fatal.message}`);
          setStage("pick");
          return;
        }
        const allRows = (rawResults.data as string[][]).filter((r) => r.some((c) => (c ?? "").trim() !== ""));
        if (allRows.length === 0) {
          setErr("File appears empty.");
          setStage("pick");
          return;
        }

        const firstRow = allRows[0].map((c) => (c ?? "").trim());
        const headerless = looksLikeData(firstRow);

        // Critical: row widths vary in many bank exports (an opening-balance line is shorter than
        // transaction rows, etc.). Use the MAX width across all rows so we don't silently drop
        // late columns where the merchant text usually lives.
        const maxCols = Math.max(...allRows.map((r) => r.length));
        const hdrs = headerless
          ? Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`)
          : firstRow.concat(
              Array.from({ length: Math.max(0, maxCols - firstRow.length) }, (_, i) => `Column ${firstRow.length + i + 1}`)
            );
        const dataRows = headerless ? allRows : allRows.slice(1);

        const rows: RawRow[] = dataRows.map((arr) => {
          const obj: RawRow = {};
          for (let i = 0; i < hdrs.length; i++) obj[hdrs[i]] = (arr[i] ?? "").toString();
          return obj;
        });

        setHeaders(hdrs);
        setRawRows(rows);
        setMapping(detectColumns(hdrs));

        const aiMapping = await detectWithAi(hdrs, rows.slice(0, 5));
        const finalMapping = aiMapping ?? detectColumns(hdrs);
        setAiSource(aiMapping ? "llm" : "fallback");
        setMapping(finalMapping);

        const valid = isMappingValid(finalMapping);
        setStage(valid ? "ready" : "needs-help");
        if (!valid) setShowMapping(true);
      },
      error: (e) => {
        setErr(e.message);
        setStage("pick");
      },
    });
  }

  // Heuristic: if any cell in the first row parses as a date or a plain number,
  // assume the file has no header row.
  function looksLikeData(cells: string[]): boolean {
    for (const c of cells) {
      if (!c) continue;
      if (/^\d{1,4}[\/\-.]\d{1,4}[\/\-.]\d{2,4}/.test(c)) return true;
      if (/^-?\(?[\d., ]{3,}\)?$/.test(c)) return true;
    }
    return false;
  }

  async function detectWithAi(hdrs: string[], sample: RawRow[]): Promise<ColumnMapping | null> {
    try {
      const res = await fetch("/api/csv/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headers: hdrs, sample_rows: sample }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.mapping || data.source !== "llm") return null;
      const m = data.mapping as Record<string, string | null>;
      return {
        date: m.date ?? undefined,
        description: m.description ?? undefined,
        amount: m.amount ?? undefined,
        debit: m.debit ?? undefined,
        credit: m.credit ?? undefined,
        merchant: m.merchant ?? undefined,
        category: m.category ?? undefined,
      };
    } catch {
      return null;
    }
  }

  function updateMapping(field: keyof ColumnMapping, value: string) {
    setMapping((prev) => {
      const next: ColumnMapping = { ...prev, [field]: value || undefined };
      if (field === "amount" && value) {
        next.debit = undefined;
        next.credit = undefined;
      }
      if ((field === "debit" || field === "credit") && value) {
        next.amount = undefined;
      }
      return next;
    });
  }

  async function submit() {
    if (!accountId || validRows.length === 0) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/transactions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, rows: validRows.map((s) => s.row) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Import failed");
      } else {
        setResult({ inserted: data.inserted, skipped: data.skipped });
        // Keep account selection, clear everything else.
        setHeaders([]);
        setRawRows([]);
        setMapping({});
        setFileName(null);
        setStage("pick");
      }
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-xl bg-surface p-4 text-sm text-muted">
        Create an account first on the Accounts tab.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wide text-muted">Import into</label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          disabled={stage === "analyzing" || stage === "ready" || stage === "needs-help"}
          className="mt-1 w-full rounded-xl border border-white/10 bg-surface px-4 py-3 outline-none focus:border-accent disabled:opacity-60"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.currency})
            </option>
          ))}
        </select>
      </div>

      {/* STAGE: pick — file picker visible */}
      {stage === "pick" && (
        <label className="block">
          <span className="text-xs uppercase tracking-wide text-muted">CSV file</span>
          <input
            type="file"
            accept=".csv,text/csv,.tsv,text/tab-separated-values"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:text-white"
          />
        </label>
      )}

      {err && (
        <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{err}</div>
      )}

      {result && (
        <div className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-300">
          Imported {result.inserted}. Skipped {result.skipped} duplicate{result.skipped === 1 ? "" : "s"}.
        </div>
      )}

      {/* STAGE: analyzing */}
      {stage === "analyzing" && (
        <div className="flex items-center gap-3 rounded-xl bg-surface p-4 text-sm">
          <Spinner />
          <div>
            <div>Analyzing {fileName}…</div>
            <div className="text-xs text-muted">Detecting columns with AI</div>
          </div>
        </div>
      )}

      {/* STAGE: needs-help — AI + fallback couldn't figure it out; show mapping UI */}
      {stage === "needs-help" && (
        <div className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-300">
          Couldn&apos;t recognize this file automatically. Pick the right columns below.
        </div>
      )}

      {/* STAGE: ready or needs-help — show preview + import */}
      {(stage === "ready" || stage === "needs-help") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-sm">
            <div>
              <div>{fileName}</div>
              <div className="text-xs text-muted">
                {validRows.length} valid · {errorRows.length} skipped
                {aiSource === "llm" && " · matched by AI"}
                {aiSource === "fallback" && " · matched locally"}
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-xs text-muted hover:text-white"
            >
              Use different file
            </button>
          </div>

          {validRows.length > 0 && (
            <div className="rounded-xl bg-surface">
              <div className="px-4 py-2 text-xs text-muted">Preview</div>
              <ul>
                {validRows.slice(0, 10).map((s, i) => (
                  <li key={i} className="flex justify-between border-t border-white/5 px-4 py-2 text-sm">
                    <div className="min-w-0 flex-1 truncate">
                      <span className="text-xs text-muted">{new Date(s.row.date).toLocaleDateString()}</span>{" "}
                      <span>{s.row.description}</span>
                    </div>
                    <span className={`ml-3 shrink-0 ${s.row.amountCents < 0 ? "" : "text-emerald-400"}`}>
                      {format(s.row.amountCents, account?.currency ?? "EUR")}
                    </span>
                  </li>
                ))}
                {validRows.length > 10 && (
                  <li className="border-t border-white/5 px-4 py-2 text-center text-xs text-muted">
                    …and {validRows.length - 10} more
                  </li>
                )}
              </ul>
            </div>
          )}

          {errorRows.length > 0 && (
            <details className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-300">
              <summary className="cursor-pointer">{errorRows.length} skipped rows</summary>
              <ul className="mt-2 space-y-1 text-xs">
                {errorRows.slice(0, 5).map((e) => (
                  <li key={e.rawIndex}>Row {e.rawIndex + 1}: {e.error}</li>
                ))}
                {errorRows.length > 5 && <li>…and {errorRows.length - 5} more</li>}
              </ul>
            </details>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowMapping((s) => !s)}
              className="text-xs text-muted hover:text-white"
            >
              {showMapping ? "Hide column mapping" : "Adjust column mapping"}
            </button>
            <button
              onClick={submit}
              disabled={busy || validRows.length === 0}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {busy ? "Importing…" : `Import ${validRows.length}`}
            </button>
          </div>

          {showMapping && headers.length > 0 && (
            <div className="space-y-3 rounded-xl bg-surface p-4">
              <MappingRow label="Date" required value={mapping.date} headers={headers} onChange={(v) => updateMapping("date", v)} />
              <MappingRow label="Description" required value={mapping.description} headers={headers} onChange={(v) => updateMapping("description", v)} />
              <div className="rounded-lg bg-bg p-3 space-y-2">
                <MappingRow label="Amount (signed)" value={mapping.amount} headers={headers} onChange={(v) => updateMapping("amount", v)} />
                <div className="text-center text-xs text-muted">— or —</div>
                <div className="grid grid-cols-2 gap-2">
                  <MappingRow label="Debit" value={mapping.debit} headers={headers} onChange={(v) => updateMapping("debit", v)} compact />
                  <MappingRow label="Credit" value={mapping.credit} headers={headers} onChange={(v) => updateMapping("credit", v)} compact />
                </div>
              </div>
              <MappingRow label="Merchant" value={mapping.merchant} headers={headers} onChange={(v) => updateMapping("merchant", v)} />
              <MappingRow label="Category" value={mapping.category} headers={headers} onChange={(v) => updateMapping("category", v)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
  );
}

function MappingRow({
  label,
  required,
  value,
  onChange,
  headers,
  compact,
}: {
  label: string;
  required?: boolean;
  value: string | undefined;
  onChange: (v: string) => void;
  headers: string[];
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : "flex items-center justify-between gap-3"}>
      <label className={`text-sm ${compact ? "block text-muted" : "shrink-0 text-muted"}`}>
        {label}{required && <span className="text-accent"> *</span>}
      </label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`${compact ? "mt-1 w-full" : "max-w-[60%]"} rounded-md border border-white/10 bg-bg px-2 py-1 text-sm outline-none focus:border-accent`}
      >
        <option value="">{required ? "Pick a column…" : "(none)"}</option>
        {headers.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
    </div>
  );
}

function format(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}
