import { describe, expect, it } from 'vitest';
import { MarketServiceError } from '../../lib/errors';
import { createApiMarketService } from './apiService';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const goodSeries = { symbol: 'IBM', window: 'week', points: [{ t: 1, price: 100 }] };

describe('api market service', () => {
  it('requests the history endpoint and parses valid results', async () => {
    let requested = '';
    const service = createApiMarketService({
      fetchFn: async (input) => {
        requested = String(input);
        return json([{ symbol: 'IBM', ok: true, data: goodSeries }]);
      },
    });
    const results = await service.getHistory(['IBM', 'MSFT'], 'week');
    expect(requested).toBe('/api/market/history?symbols=IBM%2CMSFT&window=week');
    expect(results).toEqual([{ symbol: 'IBM', ok: true, data: goodSeries }]);
  });

  it('passes through per-symbol error codes', async () => {
    const service = createApiMarketService({
      fetchFn: async () => json([{ symbol: 'ZZZZ', ok: false, error: 'NOT_FOUND' }]),
    });
    expect(await service.getQuotes(['ZZZZ'])).toEqual([{ symbol: 'ZZZZ', ok: false, error: 'NOT_FOUND' }]);
  });

  it('rejects malformed payloads with INVALID_PAYLOAD', async () => {
    for (const body of [{ not: 'an array' }, [{ symbol: 'IBM', ok: true, data: { price: 'x' } }], [{ ok: true }]]) {
      const service = createApiMarketService({ fetchFn: async () => json(body) });
      await expect(service.getQuotes(['IBM'])).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
    }
  });

  it('maps HTTP status codes to generic error codes', async () => {
    const expectations: [number, string][] = [
      [400, 'INVALID_SYMBOL'],
      [404, 'NOT_FOUND'],
      [429, 'RATE_LIMITED'],
      [500, 'UPSTREAM_UNAVAILABLE'],
    ];
    for (const [status, code] of expectations) {
      const service = createApiMarketService({ fetchFn: async () => json({ detail: 'secret upstream text' }, status) });
      const error = await service.getQuotes(['IBM']).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(MarketServiceError);
      expect(error).toMatchObject({ code, message: code });
    }
  });

  it('maps network failures to UPSTREAM_UNAVAILABLE', async () => {
    const service = createApiMarketService({
      fetchFn: async () => {
        throw new TypeError('network down');
      },
    });
    await expect(service.getQuotes(['IBM'])).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });
  });

  it('maps a request timeout to TIMEOUT', async () => {
    const service = createApiMarketService({
      timeoutMs: 10,
      fetchFn: (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        }),
    });
    await expect(service.getQuotes(['IBM'])).rejects.toMatchObject({ code: 'TIMEOUT' });
  });
});
