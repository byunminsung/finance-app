import { useCallback } from 'react';
import { useMarketService } from '../services/marketData/MarketServiceContext';
import type { PriceSeries, Quote, SymbolResult, TimeWindow } from '../types/market';
import { useAsyncData } from './useAsyncData';

/** `symbols` must be a stable reference (module constant or memoized). */
export function useQuotes(symbols: readonly string[]) {
  const service = useMarketService();
  const load = useCallback((signal: AbortSignal) => service.getQuotes(symbols, signal), [service, symbols]);
  return useAsyncData<SymbolResult<Quote>[]>(`quotes:${symbols.join(',')}`, load);
}

/** `symbols` must be a stable reference (module constant or memoized). */
export function useHistory(symbols: readonly string[], window: TimeWindow) {
  const service = useMarketService();
  const load = useCallback(
    (signal: AbortSignal) => service.getHistory(symbols, window, signal),
    [service, symbols, window],
  );
  return useAsyncData<SymbolResult<PriceSeries>[]>(`history:${window}:${symbols.join(',')}`, load);
}
