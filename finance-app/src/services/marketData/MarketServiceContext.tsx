import { createContext, useContext, type ReactNode } from 'react';
import type { MarketDataService } from '../../types/market';

const MarketServiceContext = createContext<MarketDataService | null>(null);

/** Dependency injection point: tests and future data sources swap the service here. */
export function MarketServiceProvider({ service, children }: { service: MarketDataService; children: ReactNode }) {
  return <MarketServiceContext.Provider value={service}>{children}</MarketServiceContext.Provider>;
}

export function useMarketService(): MarketDataService {
  const service = useContext(MarketServiceContext);
  if (!service) throw new Error('useMarketService must be used inside MarketServiceProvider');
  return service;
}
