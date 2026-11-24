import type { MarketErrorCode } from '../types/market';

export const MARKET_ERROR_CODES: readonly MarketErrorCode[] = [
  'INVALID_SYMBOL',
  'NOT_FOUND',
  'NO_DATA',
  'RATE_LIMITED',
  'TIMEOUT',
  'UPSTREAM_UNAVAILABLE',
  'INVALID_PAYLOAD',
];

export function isMarketErrorCode(value: unknown): value is MarketErrorCode {
  return MARKET_ERROR_CODES.some((code) => code === value);
}

/** Thrown by a data service when a whole request fails (as opposed to a single symbol). */
export class MarketServiceError extends Error {
  readonly code: MarketErrorCode;

  constructor(code: MarketErrorCode) {
    super(code);
    this.name = 'MarketServiceError';
    this.code = code;
  }
}

const USER_MESSAGES: Record<MarketErrorCode, string> = {
  INVALID_SYMBOL: 'That ticker symbol is not valid.',
  NOT_FOUND: 'Symbol not found.',
  NO_DATA: 'No data is available for this period.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and retry.',
  TIMEOUT: 'The data request timed out.',
  UPSTREAM_UNAVAILABLE: 'The market data source is unavailable.',
  INVALID_PAYLOAD: 'The market data response could not be read.',
};

/** Generic, user-safe text. Never includes upstream error text or stack traces. */
export function describeError(code: MarketErrorCode): string {
  return USER_MESSAGES[code];
}

export function toErrorCode(error: unknown): MarketErrorCode {
  return error instanceof MarketServiceError ? error.code : 'UPSTREAM_UNAVAILABLE';
}
