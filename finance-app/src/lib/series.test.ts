import { describe, expect, it } from 'vitest';
import type { PriceSeries } from '../types/market';
import { cleanPoints, rankByReturn, toChartRows, windowReturnPercent } from './series';

const series = (symbol: string, prices: number[], start = 1000): PriceSeries => ({
  symbol,
  window: 'week',
  points: prices.map((price, i) => ({ t: start + i * 1000, price })),
});

describe('cleanPoints', () => {
  it('drops non-finite and non-positive prices and sorts by time', () => {
    const result = cleanPoints([
      { t: 3, price: 30 },
      { t: 1, price: 10 },
      { t: 2, price: Number.NaN },
      { t: 4, price: 0 },
      { t: 5, price: -2 },
    ]);
    expect(result).toEqual([
      { t: 1, price: 10 },
      { t: 3, price: 30 },
    ]);
  });
});

describe('windowReturnPercent', () => {
  it('computes percent change from first to last point', () => {
    expect(windowReturnPercent(series('IBM', [100, 105, 110]))).toBeCloseTo(10);
  });

  it('returns null with fewer than two valid points', () => {
    expect(windowReturnPercent(series('IBM', [100]))).toBeNull();
    expect(windowReturnPercent(series('IBM', []))).toBeNull();
  });
});

describe('toChartRows', () => {
  it('rebases each series to percent change from its own first point', () => {
    const rows = toChartRows([series('IBM', [100, 110]), series('MSFT', [400, 380])]);
    expect(rows).toHaveLength(2);
    expect(rows[0].IBM).toBeCloseTo(0);
    expect(rows[0].MSFT).toBeCloseTo(0);
    expect(rows[1].IBM).toBeCloseTo(10);
    expect(rows[1].MSFT).toBeCloseTo(-5);
  });

  it('merges series with different timestamps into time-ordered rows', () => {
    const rows = toChartRows([series('IBM', [100, 101], 1000), series('SAP', [50, 51], 1500)]);
    expect(rows.map((row) => row.t)).toEqual([1000, 1500, 2000, 2500]);
    expect(rows[0].SAP).toBeUndefined();
  });

  it('returns no rows for empty input', () => {
    expect(toChartRows([])).toEqual([]);
    expect(toChartRows([series('IBM', [])])).toEqual([]);
  });
});

describe('rankByReturn', () => {
  it('ranks best performer first and omits series without enough data', () => {
    const ranking = rankByReturn([
      series('IBM', [100, 103]),
      series('MSFT', [100, 110]),
      series('ORCL', [100, 95]),
      series('SAP', [100]),
    ]);
    expect(ranking.map((entry) => [entry.rank, entry.symbol])).toEqual([
      [1, 'MSFT'],
      [2, 'IBM'],
      [3, 'ORCL'],
    ]);
  });
});
