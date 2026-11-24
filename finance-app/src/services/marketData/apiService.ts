import { isMarketErrorCode, MarketServiceError } from '../../lib/errors';
import type {
  MarketDataService,
  MarketErrorCode,
  PricePoint,
  PriceSeries,
  Quote,
  SymbolResult,
  TimeWindow,
} from '../../types/market';

/**
 * Client for the local market-data proxy (the server that will front Yahoo Finance).
 * The browser never calls Yahoo directly: it has no CORS support and is rate limited.
 * Every response is validated at runtime before it reaches the UI.
 *
 * Expected contract (JSON):
 *   GET /api/market/quotes?symbols=IBM,MSFT            -> SymbolResult<Quote>[]
 *   GET /api/market/history?symbols=IBM&window=week    -> SymbolResult<PriceSeries>[]
 */

const REQUEST_TIMEOUT_MS = 10_000;
const WINDOWS: readonly TimeWindow[] = ['day', 'week', 'quarter'];

export interface ApiServiceOptions {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isQuote(value: unknown): value is Quote {
  return (
    isRecord(value) &&
    typeof value.symbol === 'string' &&
    isFiniteNumber(value.price) &&
    isFiniteNumber(value.change) &&
    isFiniteNumber(value.changePercent) &&
    typeof value.currency === 'string' &&
    isFiniteNumber(value.asOf)
  );
}

function isPricePoint(value: unknown): value is PricePoint {
  return isRecord(value) && isFiniteNumber(value.t) && isFiniteNumber(value.price);
}

function isPriceSeries(value: unknown): value is PriceSeries {
  return (
    isRecord(value) &&
    typeof value.symbol === 'string' &&
    WINDOWS.some((window) => window === value.window) &&
    Array.isArray(value.points) &&
    value.points.every(isPricePoint)
  );
}

function parseResults<T>(payload: unknown, isData: (value: unknown) => value is T): SymbolResult<T>[] {
  if (!Array.isArray(payload)) throw new MarketServiceError('INVALID_PAYLOAD');
  return payload.map((entry): SymbolResult<T> => {
    if (!isRecord(entry) || typeof entry.symbol !== 'string') throw new MarketServiceError('INVALID_PAYLOAD');
    if (entry.ok === true && isData(entry.data)) return { symbol: entry.symbol, ok: true, data: entry.data };
    if (entry.ok === false && isMarketErrorCode(entry.error)) {
      return { symbol: entry.symbol, ok: false, error: entry.error };
    }
    throw new MarketServiceError('INVALID_PAYLOAD');
  });
}

function codeForStatus(status: number): MarketErrorCode {
  if (status === 400) return 'INVALID_SYMBOL';
  if (status === 404) return 'NOT_FOUND';
  if (status === 429) return 'RATE_LIMITED';
  return 'UPSTREAM_UNAVAILABLE';
}

export function createApiMarketService(options: ApiServiceOptions = {}): MarketDataService {
  const baseUrl = options.baseUrl ?? '/api/market';
  const fetchFn = options.fetchFn ?? ((input, init) => fetch(input, init));
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;

  async function request(path: string, params: Record<string, string>, signal?: AbortSignal): Promise<unknown> {
    const query = new URLSearchParams(params).toString();
    const timeout = AbortSignal.timeout(timeoutMs);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    let response: Response;
    try {
      response = await fetchFn(`${baseUrl}/${path}?${query}`, { signal: combined, headers: { Accept: 'application/json' } });
    } catch (error) {
      // Caller-initiated aborts propagate unchanged so hooks can ignore them.
      if (signal?.aborted) throw error;
      if (timeout.aborted) throw new MarketServiceError('TIMEOUT');
      throw new MarketServiceError('UPSTREAM_UNAVAILABLE');
    }
    if (!response.ok) throw new MarketServiceError(codeForStatus(response.status));
    try {
      return await response.json();
    } catch {
      throw new MarketServiceError('INVALID_PAYLOAD');
    }
  }

  return {
    sourceLabel: 'Yahoo Finance via local proxy',

    async getQuotes(symbols, signal) {
      const payload = await request('quotes', { symbols: symbols.join(',') }, signal);
      return parseResults(payload, isQuote);
    },

    async getHistory(symbols, window, signal) {
      const payload = await request('history', { symbols: symbols.join(','), window }, signal);
      return parseResults(payload, isPriceSeries);
    },
  };
}
