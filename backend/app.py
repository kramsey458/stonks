import os
from datetime import datetime

import requests
from flask import Flask, jsonify, request
from dotenv import load_dotenv

ALPHAVANTAGE_BASE_URL = "https://www.alphavantage.co/query"

app = Flask(__name__)
load_dotenv()


def fetch_sma(ticker: str, interval: str, time_period: int, series_type: str):
    api_key = os.getenv("ALPHAVANTAGE_API_KEY")
    if not api_key:
        raise RuntimeError("Missing ALPHAVANTAGE_API_KEY")

    params = {
        "function": "SMA",
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


@app.get("/api/moving-averages")
def moving_averages():
    ticker = request.args.get("ticker", "AAPL").upper()
    interval = request.args.get("interval", "daily")
    series_type = request.args.get("series_type", "close")
    time_period = int(request.args.get("time_period", "50"))

    payload = fetch_sma(ticker, interval, time_period, series_type)
    meta = payload.get("Meta Data", {})
    series = payload.get("Technical Analysis: SMA", {})

    data_points = [
        {
            "date": date,
            "sma": float(values["SMA"]),
        }
        for date, values in sorted(series.items(), reverse=True)
    ]

    return jsonify(
        {
            "meta": meta,
            "data": data_points,
            "requested": {
                "ticker": ticker,
                "interval": interval,
                "series_type": series_type,
                "time_period": time_period,
                "generated_at": datetime.utcnow().isoformat() + "Z",
            },
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
