from __future__ import annotations
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from statistics import median
from typing import Literal
from pydantic import BaseModel
from dateutil import parser as dtparser


class TxnHistory(BaseModel):
    amount_cents: int
    posted_at: str  # ISO 8601
    merchant: str


class UpcomingSplit(BaseModel):
    due_date: str
    owed_cents: int  # what *you* owe (positive) or are owed (negative)


class ForecastRequest(BaseModel):
    balance_cents: int
    transactions: list[TxnHistory]
    upcoming_splits: list[UpcomingSplit] = []
    horizon_days: int = 30
    low_balance_threshold_cents: int = 5000  # default £50 / €50 / $50


class Alert(BaseModel):
    type: Literal["LOW_BALANCE_FORECAST"]
    message: str


class ForecastResponse(BaseModel):
    min_projected_cents: int
    min_projected_date: str
    projection: list[tuple[str, int]]  # (date, projected_balance_cents)
    alert: Alert | None


def forecast(req: ForecastRequest) -> ForecastResponse:
    # Step 1: detect recurring outflows from history (≥3 hits at the same merchant, similar cadence).
    by_merchant: dict[str, list[tuple[datetime, int]]] = defaultdict(list)
    for t in req.transactions:
        if t.amount_cents >= 0:
            continue  # only outflows project as future spend
        try:
            d = dtparser.isoparse(t.posted_at).astimezone(timezone.utc)
        except (ValueError, TypeError):
            continue
        by_merchant[t.merchant.lower()].append((d, t.amount_cents))

    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    horizon_end = today + timedelta(days=req.horizon_days)

    projected_outflows: list[tuple[datetime, int]] = []
    for merchant, hits in by_merchant.items():
        if len(hits) < 3:
            continue
        hits.sort()
        gaps = [(b[0] - a[0]).days for a, b in zip(hits, hits[1:]) if (b[0] - a[0]).days > 0]
        if not gaps:
            continue
        cadence = int(median(gaps))
        if cadence < 5 or cadence > 45:
            continue  # ignore noise; monthly-ish or weekly-ish only
        typical = int(median(amt for _, amt in hits))
        last = hits[-1][0]
        next_due = last + timedelta(days=cadence)
        while next_due <= horizon_end:
            if next_due > today:
                projected_outflows.append((next_due, typical))
            next_due += timedelta(days=cadence)

    # Step 2: layer upcoming splits the user has explicitly scheduled.
    for s in req.upcoming_splits:
        try:
            d = dtparser.isoparse(s.due_date).astimezone(timezone.utc)
        except (ValueError, TypeError):
            continue
        if today < d <= horizon_end:
            projected_outflows.append((d, -abs(s.owed_cents)))

    # Step 3: walk the calendar day by day, applying outflows.
    outflows_by_day: dict[str, int] = defaultdict(int)
    for d, amt in projected_outflows:
        outflows_by_day[d.date().isoformat()] += amt

    balance = req.balance_cents
    projection: list[tuple[str, int]] = []
    min_balance = balance
    min_date = today.date().isoformat()
    cur = today
    while cur <= horizon_end:
        key = cur.date().isoformat()
        balance += outflows_by_day.get(key, 0)
        projection.append((key, balance))
        if balance < min_balance:
            min_balance = balance
            min_date = key
        cur += timedelta(days=1)

    alert: Alert | None = None
    if min_balance < req.low_balance_threshold_cents:
        alert = Alert(
            type="LOW_BALANCE_FORECAST",
            message=(
                f"Projected to dip to {_fmt(min_balance)} on {min_date} "
                f"based on recurring spend and upcoming splits."
            ),
        )

    return ForecastResponse(
        min_projected_cents=min_balance,
        min_projected_date=min_date,
        projection=projection,
        alert=alert,
    )


def _fmt(cents: int) -> str:
    sign = "-" if cents < 0 else ""
    return f"{sign}{abs(cents) / 100:.2f}"
