/** Time windows supported by the dashboard. "quarter" means the trailing 3 months (about 90 days). */
export type TimeWindow = 'day' | 'week' | 'quarter';

export interface Company {
  symbol: string;
  name: string;
  /** Chart/legend color. Kept in the registry so every view uses the same one. */
  color: string;
  /** The company all others are compared against (IBM). */
  isPrimary?: boolean;
}

export interface Quote {
  symbol: string;
  price: number;
  /** Absolute change versus the start of the current-day series. */
  change: number;
  changePercent: number;
  currency: string;
  /** Epoch milliseconds of the latest data point. */
  asOf: number;
}

export interface PricePoint {
  /** Epoch milliseconds. */
  t: number;
  price: number;
}

export interface PriceSeries {
  symbol: string;
  window: TimeWindow;
  points: PricePoint[];
}

/** Closed set of error codes. UI messages are mapped from these, never from upstream text. */
export type MarketErrorCode =
  | 'INVALID_SYMBOL'
  | 'NOT_FOUND'
  | 'NO_DATA'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'UPSTREAM_UNAVAILABLE'
  | 'INVALID_PAYLOAD';

export type SymbolResult<T> =
  | { symbol: string; ok: true; data: T }
  | { symbol: string; ok: false; error: MarketErrorCode };

/**
 * Data service contract used by the UI. Implementations: fixture (offline sample data)
 * and api (the local proxy that will front Yahoo Finance). A failure of a single symbol
 * is reported in its result; a whole-request failure rejects with MarketServiceError.
 */
export interface MarketDataService {
  /** Short label shown in the UI so users know where the numbers come from. */
  readonly sourceLabel: string;
  getQuotes(symbols: readonly string[], signal?: AbortSignal): Promise<SymbolResult<Quote>[]>;
  getHistory(
    symbols: readonly string[],
    window: TimeWindow,
    signal?: AbortSignal,
  ): Promise<SymbolResult<PriceSeries>[]>;
}
