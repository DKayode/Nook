import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { callApi } from "@/lib/apiClient";

export const runtime = "nodejs";

// Sample rows are passed straight through to the LLM. Accept any value type — papaparse
// returns "" / null / undefined for empty cells depending on bank format quirks; we
// stringify on the way out so the Python side always sees strings.
const Body = z.object({
  headers: z.array(z.string()).min(1).max(40),
  sample_rows: z.array(z.record(z.string(), z.any())).max(10),
});

type DetectResponse = {
  mapping: {
    date?: string | null;
    description?: string | null;
    amount?: string | null;
    debit?: string | null;
    credit?: string | null;
    merchant?: string | null;
    category?: string | null;
  };
  date_format?: string | null;
  decimal_separator?: string | null;
  confidence: number;
  source: "llm" | "fallback";
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    console.error("[csv/detect] unauthorized");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch (e) {
    console.error("[csv/detect] bad json:", e);
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    console.error("[csv/detect] validation failed:", JSON.stringify(parsed.error.flatten()));
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Normalize values to strings before sending to the Python service (which expects dict[str,str]).
  const payload = {
    headers: parsed.data.headers,
    sample_rows: parsed.data.sample_rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k, v == null ? "" : String(v)])
      )
    ),
  };

  try {
    console.log("[csv/detect] calling api with", payload.headers.length, "headers,", payload.sample_rows.length, "sample rows");
    const result = await callApi<DetectResponse>("/csv/detect", payload);
    console.log("[csv/detect] api returned source=", result.source, "confidence=", result.confidence);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[csv/detect] api call failed:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "detect failed", source: "fallback", mapping: {}, confidence: 0 },
      { status: 502 }
    );
  }
}
