import { useMemo } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { createMarketService, parseMarketSource } from './services/marketData';
import { MarketServiceProvider } from './services/marketData/MarketServiceContext';
import type { MarketDataService } from './types/market';

interface AppProps {
  /** Injected in tests; defaults to the service selected by VITE_MARKET_SOURCE. */
  service?: MarketDataService;
}

export function App({ service }: AppProps) {
  const resolved = useMemo(
    () => service ?? createMarketService(parseMarketSource(import.meta.env.VITE_MARKET_SOURCE)),
    [service],
  );
  return (
    <ErrorBoundary>
      <MarketServiceProvider service={resolved}>
        <DashboardPage />
      </MarketServiceProvider>
    </ErrorBoundary>
  );
}
