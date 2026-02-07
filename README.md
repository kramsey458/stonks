# Stonks - Alpha Vantage moving average sketch

This repository contains a minimal Flask + React sketch for pulling simple moving averages (SMA)
from the Alpha Vantage API and letting users store favorite tickers locally.

## Backend (Flask)

1. Create a virtual environment and install deps:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r backend/requirements.txt
   ```

2. Set the API key and run the server:

   ```bash
   export ALPHAVANTAGE_API_KEY="your-key"
   python backend/app.py
   ```

The backend exposes `/api/moving-averages` which calls Alpha Vantage's SMA endpoint and returns
JSON suitable for a frontend chart.

## Frontend (React)

The `frontend/` directory is a minimal Vite + React app. To run it:

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` calls to `http://localhost:5000`, so keep the Flask server running in a
separate terminal.

The `frontend/src/App.jsx` file contains a lightweight sketch that:

- Lets you enter a ticker and save favorites (stored in localStorage).
- Fetches SMA data from the Flask backend.
- Displays the latest values.

You can adjust styling or replace the list with a chart component as needed.

## Alpha Vantage SMA endpoint reference

The backend uses the Technical Indicators SMA endpoint:

```
https://www.alphavantage.co/query?function=SMA&symbol=AAPL&interval=daily&time_period=50&series_type=close&apikey=YOUR_KEY
```
