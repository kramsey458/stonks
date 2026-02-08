import os
from datetime import datetime

import requests
from flask import Flask, jsonify, request

ALPHAVANTAGE_BASE_URL = "https://www.alphavantage.co/query"
DEFAULT_PERIODS = [9, 21, 50, 200]

app = Flask(__name__)


def fetch_indicator(
    indicator: str, ticker: str, interval: str, time_period: int, series_type: str
):
    api_key = os.getenv("ALPHAVANTAGE_API_KEY")
    if not api_key:
        raise RuntimeError("Missing ALPHAVANTAGE_API_KEY")

    params = {
        "function": indicator,
        "symbol": ticker,
        "interval": interval,
        "time_period": time_period,
        "series_type": series_type,
        "apikey": api_key,
    }

    response = requests.get(ALPHAVANTAGE_BASE_URL, params=params, timeout=20)
    response.raise_for_status()
    payload = response.json()

    if "Error Message" in payload:
        raise ValueError(payload["Error Message"])
    if "Note" in payload:
        raise ValueError(payload["Note"])

    return payload


def extract_latest_value(payload, indicator):
    series_key = f"Technical Analysis: {indicator}"
    series = payload.get(series_key, {})
    if not series:
        raise ValueError(f"Missing {series_key} data")

    latest_date = max(series.keys())
    return float(series[latest_date][indicator])


@app.get("/api/moving-averages")
def moving_averages():
    tickers_param = request.args.get("tickers")
    tickers = (
        [item.strip().upper() for item in tickers_param.split(",") if item.strip()]
        if tickers_param
        else [request.args.get("ticker", "AAPL").upper()]
    )
    interval = request.args.get("interval", "daily")
    series_type = request.args.get("series_type", "close")
    periods = DEFAULT_PERIODS

    results = []
    for ticker in tickers:
        result = {
            "ticker": ticker,
            "interval": interval,
            "series_type": series_type,
            "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
            "sma": {},
            "ema": {},
            "errors": [],
        }

        for period in periods:
            for label, indicator in ("sma", "SMA"), ("ema", "EMA"):
                try:
                    payload = fetch_indicator(
                        indicator, ticker, interval, period, series_type
                    )
                    value = extract_latest_value(payload, indicator)
                    result[label][period] = value
                except Exception as exc:  # noqa: BLE001
                    result["errors"].append(
                        f"{ticker} {indicator} {period}d: {exc}"
                    )

        results.append(result)

    return jsonify(
        {
            "data": results,
            "requested": {
                "tickers": tickers,
                "interval": interval,
                "series_type": series_type,
                "periods": periods,
            },
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
