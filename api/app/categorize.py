import json
import os
import re
from typing import Iterable
from pydantic import BaseModel

# Defaults are deliberately minimal — 5 broad buckets. Anything that doesn't fit becomes
# 'Uncategorized', and the user assigns it to a custom category they create.
DEFAULT_CATEGORY = "Uncategorized"
ALLOWED = ["Income", "Food", "Transport", "Bills", "Shopping", "Uncategorized"]

# Rule-based first pass. Only patterns that clearly fit one of the 5 buckets.
RULES: list[tuple[re.Pattern[str], str]] = [
    # Income — salary, payroll, employer credits
    (re.compile(r"\bsalary\b|\bsalaire\b|\bpayroll\b|\bemployer\b|\bvir(ement)? ?sepa.*(salaire|paie)\b", re.I), "Income"),
    # Transport — ride hailing (excluding food brands), transit, rail, planes, lodging
    (re.compile(
        r"\buber\b(?!\W*eats)|\bbolt\b(?!\W*food)|\blyft\b|\btaxi\b|\bcabify\b|\bfreenow\b|"
        r"\btrainline\b|\bsncf\b|\brail\b|\btfl\b|\bmetro\b|\bnavigo\b|\bratp\b|"
        r"\bryanair\b|\beasyjet\b|\bair ?france\b|\bairbnb\b|\bbooking\.com\b|\bhotel\b|"
        r"\bflixbus\b|\bflix\b|\bblablacar\b",
        re.I,
    ), "Transport"),
    # Food — groceries, restaurants, delivery, cafes
    (re.compile(
        r"\btesco\b|\bsainsbury|\baldi\b|\blidl\b|\bwaitrose\b|\bcarrefour\b|\bauchan\b|"
        r"\bmonoprix\b|\bcasino\b|\bleclerc\b|\bintermarche\b|\bfranprix\b|"
        r"\bdeliveroo\b|\buber\W*eats\b|\bjust ?eat\b|\bglovo\b|\bfrichti\b|\bbolt\W*food\b|"
        r"\bstarbucks\b|\bcost(a|a coffee)\b|\bpret\b|\bcafe\b|\bcoffee\b|"
        r"\bmcdonald\b|\bmcdo\b|\bkfc\b|\bburger king\b|\bsubway\b|\brestaurant\b|\bbrasserie\b|\bbistro\b",
        re.I,
    ), "Food"),
    # Bills — utilities, telecom, insurance, streaming + tools (recurring), housing
    (re.compile(
        r"\bedf\b|\bengie\b|\btotalenergies\b|\bveolia\b|\bsuez\b|\b(soci[ée]t[ée] des )?eaux\b|\bgaz\b|"
        r"\bnetflix\b|\bspotify\b|\bdisney\b|\bapple\.com/bill\b|\bprime video\b|\bamazon\W*prime\b|"
        r"\byoutube\b|\bclaude\.?ai\b|\bopenai\b|\bchatgpt\b|\bgithub\b|\bnotion\b|\bicloud\b|"
        r"\bgoogle (cloud|one|workspace)\b|"
        r"\bfree\b|\borange\b|\bsfr\b|\bbouygues\b|\bvodafone\b|\bo2\b|\bee\b|"
        r"\bmaif\b|\bmacif\b|\baxa\b|\ballianz\b|\bgroupama\b|\bmma\b|\bassurance\b|\binsurance\b|\bmatmut\b|"
        r"\brent\b|\bloyer\b|\blandlord\b|\bmortgage\b|\bcr[ée]dit immobilier\b",
        re.I,
    ), "Bills"),
    # Shopping — retail (general purchases)
    (re.compile(
        r"\bamazon\b|\bebay\b|\betsy\b|\bzalando\b|\bfnac\b|\bdarty\b|\bboulanger\b|"
        r"\bikea\b|\bleroy merlin\b|\bdecathlon\b",
        re.I,
    ), "Shopping"),
]


class TxnIn(BaseModel):
    external_id: str
    merchant: str
    amount_cents: int


class CategorizeRequest(BaseModel):
    transactions: list[TxnIn]
    # User's custom categories. Combined with the built-in ALLOWED list for the LLM prompt.
    extra_categories: list[str] = []


class TxnCategory(BaseModel):
    external_id: str
    category: str
    confidence: float


class CategorizeResponse(BaseModel):
    categories: list[TxnCategory]


def _rule_match(merchant: str) -> str | None:
    for pat, cat in RULES:
        if pat.search(merchant):
            return cat
    return None


def categorize_batch(req: CategorizeRequest) -> CategorizeResponse:
    results: list[TxnCategory] = []
    unknown: list[TxnIn] = []

    for t in req.transactions:
        cat = _rule_match(t.merchant)
        if cat is not None:
            results.append(TxnCategory(external_id=t.external_id, category=cat, confidence=0.95))
        else:
            unknown.append(t)

    if unknown:
        results.extend(_llm_categorize(unknown, req.extra_categories))

    return CategorizeResponse(categories=results)


def _llm_categorize(items: Iterable[TxnIn], extra_categories: list[str] | None = None) -> list[TxnCategory]:
    items = list(items)
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or not items:
        return [TxnCategory(external_id=t.external_id, category=DEFAULT_CATEGORY, confidence=0.0) for t in items]

    try:
        from google import genai
    except ImportError:
        return [TxnCategory(external_id=t.external_id, category=DEFAULT_CATEGORY, confidence=0.0) for t in items]

    client = genai.Client(api_key=api_key)
    merchants = [{"index": i, "merchant": t.merchant} for i, t in enumerate(items)]

    seen: set[str] = set()
    combined: list[str] = []
    for c in list(ALLOWED) + list(extra_categories or []):
        if c and c not in seen:
            seen.add(c)
            combined.append(c)
    allowed_set = set(combined)

    system = (
        "Categorize each bank transaction. Return ONLY JSON: "
        '{"categories": [{"index": 0, "category": "Food"}, ...]}.\n'
        f"Allowed categories: {', '.join(combined)}.\n"
        "Pick the most specific category that clearly fits. If NONE of the allowed categories is a "
        "good fit (e.g. a charity donation when 'Donations' isn't in the list, or a person-to-person "
        "money transfer with no matching category), use 'Uncategorized' rather than forcing a bad match."
    )

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=json.dumps(merchants, ensure_ascii=False),
            config={
                "system_instruction": system,
                "response_mime_type": "application/json",
                "max_output_tokens": 4096,
                "temperature": 0.0,
                "thinking_config": {"thinking_budget": 0},
            },
        )
        text = (response.text or "").strip()
    except Exception:
        return [TxnCategory(external_id=t.external_id, category=DEFAULT_CATEGORY, confidence=0.0) for t in items]

    parsed: dict[int, str] = {}
    try:
        data = json.loads(text)
        for entry in data.get("categories", []):
            idx = entry.get("index")
            cat = entry.get("category")
            if isinstance(idx, int) and isinstance(cat, str) and cat in allowed_set:
                parsed[idx] = cat
    except json.JSONDecodeError:
        pass

    out: list[TxnCategory] = []
    for i, t in enumerate(items):
        category = parsed.get(i, DEFAULT_CATEGORY)
        out.append(TxnCategory(
            external_id=t.external_id,
            category=category,
            confidence=0.8 if category != DEFAULT_CATEGORY else 0.0,
        ))
    return out
