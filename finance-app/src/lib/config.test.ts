import { describe, expect, it } from 'vitest';
import { isValidSymbol, normalizeSymbol } from './symbols';
import { DEFAULT_WINDOW, parseTimeWindow, WINDOW_SPAN_MS } from './timeWindows';

describe('parseTimeWindow', () => {
  it('accepts the three supported windows', () => {
    expect(parseTimeWindow('day')).toBe('day');
    expect(parseTimeWindow('week')).toBe('week');
    expect(parseTimeWindow('quarter')).toBe('quarter');
  });

  it('falls back to the default for unknown or missing values', () => {
    expect(parseTimeWindow(null)).toBe(DEFAULT_WINDOW);
    expect(parseTimeWindow('year')).toBe(DEFAULT_WINDOW);
  });

  it('defines quarter as the trailing ~3 months (90 days)', () => {
    expect(WINDOW_SPAN_MS.quarter).toBe(90 * 24 * 60 * 60 * 1000);
  });
});

describe('isValidSymbol', () => {
  it('accepts typical tickers', () => {
    for (const symbol of ['IBM', 'MSFT', 'BRK-B', 'BF.B']) expect(isValidSymbol(symbol)).toBe(true);
  });

  it('rejects empty, lowercase, oversized and unsafe input', () => {
    for (const symbol of ['', 'ibm', 'TOOLONGSYMBOL', 'IBM;DROP', '../etc', 'IBM MSFT', '1IBM']) {
      expect(isValidSymbol(symbol)).toBe(false);
    }
  });
});

describe('normalizeSymbol', () => {
  it('trims and uppercases', () => {
    expect(normalizeSymbol('  nvda ')).toBe('NVDA');
  });
});
