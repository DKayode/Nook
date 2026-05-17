import os
from fastapi import FastAPI, Header, HTTPException

from .categorize import categorize_batch, CategorizeRequest, CategorizeResponse
from .forecast import forecast, ForecastRequest, ForecastResponse
from .csv_parser import parse_csv_schema, CsvParseRequest, CsvParseResponse

app = FastAPI(title="expense-tracker-api")

INTERNAL_TOKEN = os.environ.get("API_INTERNAL_TOKEN", "")


def _require_internal(x_internal_token: str | None) -> None:
    if not INTERNAL_TOKEN:
        return  # dev: allow if not configured
    if x_internal_token != INTERNAL_TOKEN:
        raise HTTPException(status_code=401, detail="bad internal token")


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.post("/categorize", response_model=CategorizeResponse)
def categorize(req: CategorizeRequest, x_internal_token: str | None = Header(default=None)) -> CategorizeResponse:
    _require_internal(x_internal_token)
    return categorize_batch(req)


@app.post("/forecast", response_model=ForecastResponse)
def forecast_endpoint(req: ForecastRequest, x_internal_token: str | None = Header(default=None)) -> ForecastResponse:
    _require_internal(x_internal_token)
    return forecast(req)


@app.post("/csv/detect", response_model=CsvParseResponse)
def csv_detect(req: CsvParseRequest, x_internal_token: str | None = Header(default=None)) -> CsvParseResponse:
    _require_internal(x_internal_token)
    return parse_csv_schema(req)
