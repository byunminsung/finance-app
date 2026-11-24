import { describe, expect, it } from 'vitest';
import { COMPANIES, MAX_COMPETITORS } from '../../config/companies';
import { createFixtureMarketService } from './fixtureService';

const NOW = Date.UTC(2026, 10, 24, 15, 0, 0);
const service = createFixtureMarketService({ now: () => NOW });

describe('company registry', () => {
  it('has IBM as the only primary and at most four competitors', () => {
    expect(COMPANIES.filter((c) => c.isPrimary).map((c) => c.symbol)).toEqual(['IBM']);
    expect(COMPANIES.length - 1).toBeLessThanOrEqual(MAX_COMPETITORS);
  });
});

describe('fixture market service', () => {
  it('is deterministic for the same clock', async () => {
    const a = await service.getHistory(['IBM'], 'week');
    const b = await createFixtureMarketService({ now: () => NOW }).getHistory(['IBM'], 'week');
    expect(a).toEqual(b);
  });

  it('returns history for every window with ordered, positive prices', async () => {
    for (const window of ['day', 'week', 'quarter'] as const) {
      const [result] = await service.getHistory(['IBM'], window);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const { points } = result.data;
      expect(points.length).toBeGreaterThan(10);
      expect(points.every((p, i) => p.price > 0 && (i === 0 || p.t > points[i - 1].t))).toBe(true);
    }
  });

  it('spans roughly the requested window', async () => {
    const [result] = await service.getHistory(['IBM'], 'quarter');
    if (!result.ok) throw new Error('expected success');
    const spanDays = (result.data.points.at(-1)!.t - result.data.points[0].t) / 86_400_000;
    expect(spanDays).toBeGreaterThan(85);
    expect(spanDays).toBeLessThanOrEqual(90);
  });

  it('returns quotes with a consistent change calculation', async () => {
    const [result] = await service.getQuotes(['MSFT']);
    if (!result.ok) throw new Error('expected success');
    expect(result.data.currency).toBe('USD');
    expect(result.data.changePercent).toBeCloseTo((result.data.change / (result.data.price - result.data.change)) * 100, 6);
  });

  it('reports per-symbol failures without failing the whole request', async () => {
    const results = await service.getQuotes(['IBM', 'ZZZZ', 'bad symbol']);
    expect(results.map((r) => r.ok)).toEqual([true, false, false]);
    expect(results[1]).toMatchObject({ ok: false, error: 'NOT_FOUND' });
    expect(results[2]).toMatchObject({ ok: false, error: 'INVALID_SYMBOL' });
  });

  it('rejects when the request is aborted', async () => {
    const controller = new AbortController();
    const slow = createFixtureMarketService({ now: () => NOW, delayMs: 50 });
    const pending = slow.getQuotes(['IBM'], controller.signal);
    controller.abort();
    await expect(pending).rejects.toBeDefined();
  });
});
