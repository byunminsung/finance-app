import { findCompany } from '../../config/companies';
import { WINDOW_SPAN_MS } from '../../lib/timeWindows';
import { isValidSymbol } from '../../lib/symbols';
import type {
  MarketDataService,
  PricePoint,
  PriceSeries,
  Quote,
  SymbolResult,
  TimeWindow,
} from '../../types/market';

/**
 * Offline sample data. Prices are SYNTHETIC (seeded random walk around plausible levels),
 * not real market data. Output is deterministic for a given symbol, window and clock time,
 * which keeps tests, CI and workshop demos stable without any network access.
 */

const BASE_PRICES: Readonly<Record<string, number>> = {
  IBM: 250,
  MSFT: 480,
  ORCL: 220,
  SAP: 260,
  CRM: 270,
};

const STEP_MS: Record<TimeWindow, number> = {
  day: 5 * 60 * 1000,
  week: 60 * 60 * 1000,
  quarter: 24 * 60 * 60 * 1000,
};

/** Per-step volatility (fraction of price). */
const VOLATILITY: Record<TimeWindow, number> = {
  day: 0.0012,
  week: 0.0025,
  quarter: 0.011,
};

export interface FixtureOptions {
  /** Clock override for tests. */
  now?: () => number;
  /** Artificial latency so loading states are visible in demos. */
  delayMs?: number;
}

/** Small deterministic PRNG (mulberry32). */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function generatePoints(symbol: string, window: TimeWindow, now: number): PricePoint[] {
  const step = STEP_MS[window];
  const end = Math.floor(now / step) * step;
  const count = Math.floor(WINDOW_SPAN_MS[window] / step);
  const random = createRandom(hashString(`${symbol}:${window}`));
  const volatility = VOLATILITY[window];
  const points: PricePoint[] = [];
  let price = BASE_PRICES[symbol];
  for (let i = count - 1; i >= 0; i -= 1) {
    price *= 1 + (random() - 0.5) * 2 * volatility;
    points.push({ t: end - i * step, price: Math.round(price * 100) / 100 });
  }
  return points;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

export function createFixtureMarketService(options: FixtureOptions = {}): MarketDataService {
  const now = options.now ?? Date.now;
  const delayMs = options.delayMs ?? 0;

  function lookup(symbol: string): SymbolResult<never> | null {
    if (!isValidSymbol(symbol)) return { symbol, ok: false, error: 'INVALID_SYMBOL' };
    if (!(symbol in BASE_PRICES) || !findCompany(symbol)) return { symbol, ok: false, error: 'NOT_FOUND' };
    return null;
  }

  return {
    sourceLabel: 'Sample data (offline, synthetic)',

    async getQuotes(symbols, signal) {
      await sleep(delayMs, signal);
      return symbols.map((symbol): SymbolResult<Quote> => {
        const failure = lookup(symbol);
        if (failure) return failure;
        const points = generatePoints(symbol, 'day', now());
        const first = points[0];
        const last = points[points.length - 1];
        return {
          symbol,
          ok: true,
          data: {
            symbol,
            price: last.price,
            change: last.price - first.price,
            changePercent: (last.price / first.price - 1) * 100,
            currency: 'USD',
            asOf: last.t,
          },
        };
      });
    },

    async getHistory(symbols, window, signal) {
      await sleep(delayMs, signal);
      return symbols.map((symbol): SymbolResult<PriceSeries> => {
        const failure = lookup(symbol);
        if (failure) return failure;
        return { symbol, ok: true, data: { symbol, window, points: generatePoints(symbol, window, now()) } };
      });
    },
  };
}
