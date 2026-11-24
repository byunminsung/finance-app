# Finance App - Market Dashboard

React + TypeScript dashboard comparing **IBM** with four competitors (Microsoft, Oracle, SAP, Salesforce) over three windows: **today**, **last 7 days**, and **last quarter** (trailing 3 months, ~90 days).

> Current data source: **offline synthetic sample data** (`VITE_MARKET_SOURCE=fixture`). It is not real market data. A Yahoo Finance proxy is the next step; the UI is already wired to its API contract (see [Data layer](#data-layer)). For demonstration only, not investment advice.

## Quick start

Requires Node.js 22.12 or later.

```bash
cd finance-app
npm ci            # or: npm install
npm run dev       # http://127.0.0.1:5173  (bound to loopback only)
```

## Validation

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest (unit + component tests)
npm run build       # typecheck + production build
```

Success: every command exits 0, and the dashboard shows five companies on all three tabs.

Try `?window=week` or `?window=quarter` in the URL: the selected view is kept in the query string.

## Folder layout

```text
src/
├─ main.tsx, App.tsx          # Entry; App wires ErrorBoundary + service provider
├─ types/market.ts            # Domain types and the MarketDataService contract
├─ config/companies.ts        # Company registry: add or change tickers here
├─ services/marketData/       # Data service layer (the only code that fetches data)
│  ├─ fixtureService.ts       #   offline, deterministic sample data
│  ├─ apiService.ts           #   client for the local proxy (validates responses)
│  ├─ index.ts                #   createMarketService(source)
│  └─ MarketServiceContext.tsx#   DI via React context
├─ hooks/                     # useAsyncData, useQuotes/useHistory, useTimeWindow
├─ lib/                       # Pure helpers: series math, formatting, errors, windows, symbols
├─ components/                # Reusable UI: ChartCard, ComparisonLineChart, state views, ErrorBoundary
├─ features/dashboard/        # DashboardPage, WindowTabs, WindowView, SummaryCards, RankingTable
└─ test/setup.ts
```

## Architecture

- **Components** are presentational and receive props. Only `DashboardPage` and `WindowView` call hooks.
- **Data service layer.** The UI depends on the `MarketDataService` interface, never on a concrete source. Swap the source with `VITE_MARKET_SOURCE=fixture|api`, or inject a service in tests via `<App service={...} />`.
- **State.** Server data is loaded by hooks with loading/success/error/retry and request cancellation. The selected window lives in the URL. There is no global store.
- **Charts.** Recharts, lazy-loaded. Each series is rebased to % change from the window start so companies with different prices share one axis (see `lib/series.ts`).
- **Errors.** Failures map to a closed set of codes (`lib/errors.ts`) with generic user messages. One failing symbol does not blank the dashboard, and a top-level error boundary is the last resort.

## Data layer

`apiService.ts` expects a proxy (not yet implemented) that fronts Yahoo Finance, because browsers cannot call Yahoo directly (no CORS, rate limits):

```text
GET /api/market/quotes?symbols=IBM,MSFT           -> SymbolResult<Quote>[]
GET /api/market/history?symbols=IBM&window=week   -> SymbolResult<PriceSeries>[]   (window: day|week|quarter)
```

Vite proxies `/api` to `127.0.0.1:8787`. Responses are validated at runtime; malformed payloads surface as `INVALID_PAYLOAD`.

## Extending

| Change | Where |
|---|---|
| Add or change a company (IBM + max 4 competitors) | `src/config/companies.ts` |
| New time window | `types/market.ts` (`TimeWindow`), `lib/timeWindows.ts` |
| New data source (e.g. Yahoo proxy) | implement `MarketDataService` in `services/marketData/`, register in `index.ts` |
| New chart or view | new component in `components/` or `features/dashboard/`, compose in `WindowView` |
| User-selected company graph (workshop part 2) | new component under `features/dashboard/` + hook using `useHistory`; validate input with `lib/symbols.ts` |
