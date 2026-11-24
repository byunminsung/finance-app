import { describe, expect, it } from 'vitest';
import { CATALOG, findListedCompany } from './catalog';
import { COMPANIES } from './companies';
import { createFixtureMarketService } from '../services/marketData/fixtureService';

describe('catalog', () => {
  it('has unique symbols and includes every tracked company', () => {
    const symbols = CATALOG.map((c) => c.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
    for (const company of COMPANIES) expect(findListedCompany(company.symbol)).toBeDefined();
  });

  it('does not alter the tracked-company registry used by the dashboards', () => {
    expect(COMPANIES.map((c) => c.symbol)).toEqual(['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM']);
  });

  it('every suggested symbol is actually served by the fixture service', async () => {
    const service = createFixtureMarketService();
    const results = await service.getQuotes(CATALOG.map((c) => c.symbol));
    expect(results.filter((r) => !r.ok)).toEqual([]);
  });
});
