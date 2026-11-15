# Finance data layer

```
Browser                         Node (server/)                     Yahoo
─────────────────────────       ──────────────────────────────     ───────────────
React components
   │ hooks (state/queries.ts)
   ▼
MarketDataProvider ──/api/*──▶  app.ts  (routes, validation, cache)
 ├ MockProvider                     │ normalize.ts (shared with UI tests)
 └ YahooProxyProvider               ▼
                                MarketClient ── yahooClient.ts ──▶ yahoo-finance2
```

Yahoo is unofficial and cannot be called from a browser (no CORS), so a small proxy
wraps it. **Only `server/yahooClient.ts` imports `yahoo-finance2`.**

## Data contract (what the UI sees)

| Endpoint | Returns |
|---|---|
| `GET /api/quotes?symbols=IBM,MSFT` | `Quote[]` in the requested order |
| `GET /api/history?symbol=IBM&window=day\|week\|quarter` | `Series` (`{ symbol, window, points: [{ time, close }] }`) |
| `GET /api/health` | `{ ok: true }` |

Errors are always `{ code, message }`: `400 BAD_REQUEST`, `404 NOT_FOUND`, `502 UPSTREAM_ERROR`.
Upstream error text is never forwarded to the client.

## Time windows

Defined once in `server/rangeConfig.ts`:

| Window | Lookback | Bar | Notes |
|---|---|---|---|
| `day` | 5 days | 5 min | Trimmed to the latest session, so weekends and holidays still show data |
| `week` | 7 days | 60 min | |
| `quarter` | 92 days | 1 day | |

Only regular-hours bars are requested (`includePrePost: false`).

## Normalization (`src/domain/normalize.ts`)

- `normalizeQuote`: returns `null` without a finite price; missing change defaults to `0`; name falls back to `longName`, then the symbol.
- `normalizeSeries`: drops null closes and invalid dates, sorts by time, trims `day` to the last session.

## Run it

```bash
npm run dev        # UI on mock data, no network needed
npm run dev:live   # UI + proxy on real Yahoo data
npm run server     # proxy only (PORT, default 8787)
```

## Extending

**Add a company.** Edit `DEFAULT_COMPANIES` in `src/config/companies.ts`. No other change:
the server accepts any ticker, and the UI builds one query per symbol.
`MAX_COMPANIES` documents the intended cap of five; the server allows up to 10 per quotes call.

**Add a time window.** Add the id to `TimeWindow` (`domain/types.ts`), an entry in `RANGES`
(`server/rangeConfig.ts`), and a tab in `TIME_WINDOWS` (`config/companies.ts`).

**Change data vendor.** Implement `MarketClient` in `server/` and pass it to `createApp`
in `server/index.ts`. Routes, caching, and the UI are unchanged.

**Add a metric.** Put pure functions in `src/domain/metrics.ts` with a unit test.

## Known limits

- Requires Node 22+ (`yahoo-finance2` v4).
- Cache is in-memory, 60 s, per process; there is no persistence or rate limiting.
- Yahoo data may be delayed and the API can change without notice.
