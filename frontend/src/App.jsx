import { useEffect, useMemo, useState } from "react";

const DEFAULT_TICKER = "AAPL";

const storageKey = "favoriteTickers";

const loadFavorites = () => {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveFavorites = (favorites) => {
  window.localStorage.setItem(storageKey, JSON.stringify(favorites));
};

export default function App() {
  const [ticker, setTicker] = useState(DEFAULT_TICKER);
  const [favorites, setFavorites] = useState(() => loadFavorites());
  const [timePeriod, setTimePeriod] = useState(50);
  const [interval, setInterval] = useState("daily");
  const [seriesType, setSeriesType] = useState("close");
  const [smaData, setSmaData] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const favoriteOptions = useMemo(
    () => Array.from(new Set(favorites.map((item) => item.toUpperCase()))),
    [favorites]
  );

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const addFavorite = () => {
    const trimmed = ticker.trim().toUpperCase();
    if (!trimmed) return;
    if (!favorites.includes(trimmed)) {
      setFavorites((prev) => [...prev, trimmed]);
    }
  };

  const fetchMovingAverage = async () => {
    setStatus("loading");
    setError(null);

    try {
      const params = new URLSearchParams({
        ticker,
        time_period: String(timePeriod),
        interval,
        series_type: seriesType,
      });

      const response = await fetch(`/api/moving-averages?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch moving averages.");
      }

      const payload = await response.json();
      setSmaData(payload.data ?? []);
      setStatus("success");
    } catch (fetchError) {
      setError(fetchError.message);
      setStatus("error");
    }
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Moving Averages</h1>
      <section style={{ marginBottom: "1.5rem" }}>
        <label>
          Ticker
          <input
            style={{ marginLeft: "0.5rem" }}
            value={ticker}
            onChange={(event) => setTicker(event.target.value.toUpperCase())}
          />
        </label>
        <button style={{ marginLeft: "0.5rem" }} onClick={addFavorite}>
          Save to Favorites
        </button>
        <button style={{ marginLeft: "0.5rem" }} onClick={fetchMovingAverage}>
          Load SMA
        </button>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <label>
          Favorites
          <select
            style={{ marginLeft: "0.5rem" }}
            value={ticker}
            onChange={(event) => setTicker(event.target.value)}
          >
            {[DEFAULT_TICKER, ...favoriteOptions].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <label>
          Time Period
          <input
            type="number"
            style={{ marginLeft: "0.5rem", width: "6rem" }}
            value={timePeriod}
            onChange={(event) => setTimePeriod(Number(event.target.value))}
          />
        </label>
        <label style={{ marginLeft: "1rem" }}>
          Interval
          <select
            style={{ marginLeft: "0.5rem" }}
            value={interval}
            onChange={(event) => setInterval(event.target.value)}
          >
            <option value="daily">daily</option>
            <option value="weekly">weekly</option>
            <option value="monthly">monthly</option>
          </select>
        </label>
        <label style={{ marginLeft: "1rem" }}>
          Series Type
          <select
            style={{ marginLeft: "0.5rem" }}
            value={seriesType}
            onChange={(event) => setSeriesType(event.target.value)}
          >
            <option value="close">close</option>
            <option value="open">open</option>
            <option value="high">high</option>
            <option value="low">low</option>
          </select>
        </label>
      </section>

      {status === "loading" && <p>Loading…</p>}
      {status === "error" && <p style={{ color: "crimson" }}>{error}</p>}

      {status === "success" && (
        <section>
          <h2>Latest SMA values</h2>
          <ul>
            {smaData.slice(0, 5).map((point) => (
              <li key={point.date}>
                {point.date}: {point.sma.toFixed(2)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
