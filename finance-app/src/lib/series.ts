import type { PricePoint, PriceSeries } from '../types/market';

/** One chart row: a timestamp plus the % change of each symbol that has a point at that time. */
export type ChartRow = { t: number } & Record<string, number>;

export interface RankedReturn {
  symbol: string;
  returnPercent: number;
  /** 1 = best performer. */
  rank: number;
}

/** Drops unusable points (non-finite or non-positive prices) and sorts by time. */
export function cleanPoints(points: readonly PricePoint[]): PricePoint[] {
  return points
    .filter((point) => Number.isFinite(point.t) && Number.isFinite(point.price) && point.price > 0)
    .sort((a, b) => a.t - b.t);
}

/** Percent change from the first to the last valid point, or null if there are fewer than 2 points. */
export function windowReturnPercent(series: PriceSeries): number | null {
  const points = cleanPoints(series.points);
  if (points.length < 2) return null;
  const first = points[0].price;
  const last = points[points.length - 1].price;
  return (last / first - 1) * 100;
}

/**
 * Rebases every series to % change from its own first point so companies with very
 * different share prices can share one axis, then merges them by timestamp.
 */
export function toChartRows(seriesList: readonly PriceSeries[]): ChartRow[] {
  const rows = new Map<number, ChartRow>();
  for (const series of seriesList) {
    const points = cleanPoints(series.points);
    if (points.length === 0) continue;
    const base = points[0].price;
    for (const point of points) {
      const row = rows.get(point.t) ?? ({ t: point.t } as ChartRow);
      row[series.symbol] = (point.price / base - 1) * 100;
      rows.set(point.t, row);
    }
  }
  return [...rows.values()].sort((a, b) => a.t - b.t);
}

/** Ranks series by window return (best first). Series without enough data are omitted. */
export function rankByReturn(seriesList: readonly PriceSeries[]): RankedReturn[] {
  return seriesList
    .map((series) => ({ symbol: series.symbol, returnPercent: windowReturnPercent(series) }))
    .filter((entry): entry is { symbol: string; returnPercent: number } => entry.returnPercent !== null)
    .sort((a, b) => b.returnPercent - a.returnPercent)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
