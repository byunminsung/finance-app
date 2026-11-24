import { createApiMarketService } from './apiService';
import { createFixtureMarketService } from './fixtureService';
import type { MarketDataService } from '../../types/market';

export type MarketSource = 'fixture' | 'api';

/** Unknown or missing values fall back to the offline fixture. */
export function parseMarketSource(value: string | undefined): MarketSource {
  return value === 'api' ? 'api' : 'fixture';
}

export function createMarketService(source: MarketSource): MarketDataService {
  return source === 'api' ? createApiMarketService() : createFixtureMarketService({ delayMs: 250 });
}
