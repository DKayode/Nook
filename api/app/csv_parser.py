from __future__ import annotations
import json
import os
import re
from typing import Optional
from pydantic import BaseModel


class CsvParseRequest(BaseModel):
    headers: list[str]
    sample_rows: list[dict[str, str]]


class CsvMapping(BaseModel):
    date: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[str] = None
    debit: Optional[str] = None
    credit: Optional[str] = None
    merchant: Optional[str] = None
    category: Optional[str] = None


class CsvParseResponse(BaseModel):
    mapping: CsvMapping
    date_format: Optional[str] = None
    decimal_separator: Optional[str] = None
    confidence: float = 0.0
    source: str = "llm"     # llm | fallback


SYSTEM = (
    "You analyze bank-statement CSVs and identify which header column corresponds to each canonical "
    "field. Banks export in many languages (English, French, German, Spanish, Italian, Dutch) and many "
    "conventions. The headers may be synthetic (e.g. 'Column 1', 'Column 2') if the file has no header "
    "row — in that case, identify columns purely by looking at the sample data.\n\n"
    "Return ONLY a JSON object — no markdown, no commentary — with these keys:\n"
    "  date          : column with the transaction date\n"
    "  description   : the MOST INFORMATIVE text column — the one a human would read to know what the "
    "transaction was. Prefer columns with unique, varied, multi-word values like merchant names, payment "
    "labels, or transfer references. DO NOT pick a column whose values repeat across many rows like "
    "'Carte'/'Virement'/'CB'/'Card'/'Transfer'/'Debit'/'Credit' — those are transaction *types*, not "
    "descriptions. If both a type column and a description column exist, pick the description.\n"
    "  amount        : a SIGNED amount column (negative = expense). Use this OR debit+credit, not both.\n"
    "  debit         : debit/expense column (positive when money leaves)\n"
    "  credit        : credit/income column (positive when money enters)\n"
    "  merchant      : payee / counterparty / beneficiary, if SEPARATE from description\n"
    "  category      : user-assigned category, if present\n"
    "  date_format   : 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'DD.MM.YYYY' | 'MM/DD/YYYY'\n"
    "  decimal_separator : '.' or ','\n"
    "  confidence    : 0.0–1.0\n\n"
    "Use null for fields not present. Prefer signed amount over debit+credit when both exist."
)


def detect_via_llm(req: CsvParseRequest) -> Optional[CsvParseResponse]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[csv/detect] no GEMINI_API_KEY", flush=True)
        return None

    try:
        from google import genai
    except ImportError:
        print("[csv/detect] google-genai not installed", flush=True)
        return None

    client = genai.Client(api_key=api_key)
    sample = "\n".join(json.dumps(r, ensure_ascii=False) for r in req.sample_rows[:5])
    user = f"Headers: {json.dumps(req.headers, ensure_ascii=False)}\n\nSample rows:\n{sample}"
    print(f"[csv/detect] HEADERS: {json.dumps(req.headers, ensure_ascii=False)}", flush=True)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user,
            config={
                "system_instruction": SYSTEM,
                "response_mime_type": "application/json",
                "max_output_tokens": 2048,
                "temperature": 0.0,
                # Gemini 2.5 thinks before answering by default and burns output tokens doing so.
                # Column extraction is a simple structured task — turn it off.
                "thinking_config": {"thinking_budget": 0},
            },
        )
    except Exception as e:
        print(f"[csv/detect] gemini call raised: {type(e).__name__}: {e}", flush=True)
        return None

    try:
        text = (response.text or "").strip()
    except Exception as e:
        print(f"[csv/detect] response.text raised: {type(e).__name__}: {e}", flush=True)
        try:
            print(f"[csv/detect] candidates: {response.candidates}", flush=True)
        except Exception:
            pass
        return None

    one_line = " ".join(text.split())
    print(f"[csv/detect] gemini returned ({len(text)} chars): {one_line[:500]}", flush=True)

    data = _extract_json(text)
    if not isinstance(data, dict):
        print(f"[csv/detect] could not extract JSON dict from response", flush=True)
        return None

    valid = set(req.headers)

    def col(key: str) -> Optional[str]:
        v = data.get(key)
        return v if isinstance(v, str) and v in valid else None

    mapping = CsvMapping(
        date=col("date"),
        description=col("description"),
        amount=col("amount"),
        debit=col("debit"),
        credit=col("credit"),
        merchant=col("merchant"),
        category=col("category"),
    )
    if mapping.amount:
        mapping.debit = None
        mapping.credit = None

    resp = CsvParseResponse(
        mapping=mapping,
        date_format=data.get("date_format") if isinstance(data.get("date_format"), str) else None,
        decimal_separator=data.get("decimal_separator") if isinstance(data.get("decimal_separator"), str) else None,
        confidence=float(data.get("confidence", 0.7)) if isinstance(data.get("confidence"), (int, float)) else 0.7,
        source="llm",
    )
    print(f"[csv/detect] FINAL mapping: {mapping.model_dump_json()}", flush=True)
    return resp


def _extract_json(text: str) -> Optional[object]:
    s = text.strip()
    fence = re.match(r"^```(?:json)?\s*(.*?)\s*```$", s, re.DOTALL)
    if fence:
        s = fence.group(1)
    start = s.find("{")
    end = s.rfind("}")
    if start == -1 or end == -1 or end < start:
        return None
    try:
        return json.loads(s[start : end + 1])
    except json.JSONDecodeError:
        return None


def parse_csv_schema(req: CsvParseRequest) -> CsvParseResponse:
    out = detect_via_llm(req)
    if out is not None:
        return out
    return CsvParseResponse(mapping=CsvMapping(), confidence=0.0, source="fallback")
