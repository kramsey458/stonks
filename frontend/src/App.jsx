import { useEffect, useMemo, useState } from "react";
import "./App.css";

const DEFAULT_TICKERS = ["AAPL", "MSFT", "TSLA"];
const PERIODS = [9, 21, 50, 200];
const storageKey = "favoriteTickers";

const loadFavorites = () => {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : DEFAULT_TICKERS;
  } catch {
    return DEFAULT_TICKERS;
  }
};

const saveFavorites = (favorites) => {
  window.localStorage.setItem(storageKey, JSON.stringify(favorites));
};

const formatValue = (value) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(2)
    : "–";

export default function App() {
  const [tickerInput, setTickerInput] = useState("");
  const [tickers, setTickers] = useState(() => loadFavorites());
  const [interval, setInterval] = useState("daily");
  const [seriesType, setSeriesType] = useState("close");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);

  const favoriteOptions = useMemo(
    () => Array.from(new Set(tickers.map((item) => item.toUpperCase()))),
    [tickers]
  );

  useEffect(() => {
    saveFavorites(tickers);
  }, [tickers]);

  const addTicker = () => {
    const trimmed = tickerInput.trim().toUpperCase();
    if (!trimmed) return;
    if (!tickers.includes(trimmed)) {
      setTickers((prev) => [...prev, trimmed]);
    }
    setTickerInput("");
  };

  const removeTicker = (symbol) => {
    setTickers((prev) => prev.filter((item) => item !== symbol));
  };

  const fetchMovingAverages = async () => {
    if (!tickers.length) {
      setError("Add at least one ticker to continue.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const params = new URLSearchParams({
        tickers: tickers.join(","),
        interval,
        series_type: seriesType,
      });

      const response = await fetch(`/api/moving-averages?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch moving averages.");
      }

      const payload = await response.json();
      setResults(payload.data ?? []);
      setStatus("success");
    } catch (fetchError) {
      setError(fetchError.message);
      setStatus("error");
    }
  };

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Market Insights</p>
          <h1>Moving averages at a glance</h1>
          <p className="subtitle">
            Track SMA and EMA signals across your watchlist with a modern,
            configurable dashboard.
          </p>
        </div>
        <div className="hero-card">
          <h2>Watchlist controls</h2>
          <p>Manage tickers and update your indicator settings.</p>
          <div className="control-grid">
            <label>
              Interval
              <select
                value={interval}
                onChange={(event) => setInterval(event.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label>
              Series
              <select
                value={seriesType}
                onChange={(event) => setSeriesType(event.target.value)}
              >
                <option value="close">Close</option>
                <option value="open">Open</option>
                <option value="high">High</option>
                <option value="low">Low</option>
              </select>
            </label>
          </div>
          <button
            className="primary"
            onClick={fetchMovingAverages}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Loading..." : "Refresh indicators"}
          </button>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Your watchlist</h2>
            <p>Add tickers to request SMA and EMA values for 9, 21, 50, and 200 days.</p>
          </div>
          <div className="ticker-input">
            <input
              value={tickerInput}
              onChange={(event) => setTickerInput(event.target.value)}
              placeholder="Add ticker (e.g. NVDA)"
            />
            <button onClick={addTicker}>Add</button>
          </div>
        </div>
        <div className="chip-row">
          {favoriteOptions.map((symbol) => (
            <span key={symbol} className="chip">
              {symbol}
              <button
                type="button"
                onClick={() => removeTicker(symbol)}
                aria-label={`Remove ${symbol}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </section>

      {status === "error" && <div className="alert">{error}</div>}

      <section className="grid">
        {results.map((item) => (
          <article key={item.ticker} className="card">
            <div className="card-header">
              <div>
                <h3>{item.ticker}</h3>
                <p className="muted">
                  {item.interval} · {item.series_type}
                </p>
              </div>
              <span className="pill">Updated {item.generated_at}</span>
            </div>

            <div className="table">
              <div className="table-row table-head">
                <span>Period</span>
                <span>SMA</span>
                <span>EMA</span>
              </div>
              {PERIODS.map((period) => (
                <div key={period} className="table-row">
                  <span>{period}d</span>
                  <span>{formatValue(item.sma?.[period])}</span>
                  <span>{formatValue(item.ema?.[period])}</span>
                </div>
              ))}
            </div>

            {item.errors?.length ? (
              <div className="card-footer">
                {item.errors.map((message) => (
                  <p key={message} className="muted">
                    {message}
                  </p>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
}
