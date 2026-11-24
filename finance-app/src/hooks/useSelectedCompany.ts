import { useCallback, useState } from 'react';
import { isValidSymbol, normalizeSymbol } from '../lib/symbols';

const PARAM = 'company';

/** The URL is untrusted input: anything that is not a well-formed symbol is dropped. */
function readFromUrl(): string | null {
  const raw = new URLSearchParams(window.location.search).get(PARAM);
  if (raw === null) return null;
  const symbol = normalizeSymbol(raw);
  return isValidSymbol(symbol) ? symbol : null;
}

/** User-selected company, kept in the URL (?company=NVDA) so the view can be shared. */
export function useSelectedCompany(): [string | null, (symbol: string | null) => void] {
  const [selected, setSelectedState] = useState<string | null>(readFromUrl);

  const setSelected = useCallback((symbol: string | null) => {
    const url = new URL(window.location.href);
    if (symbol === null) url.searchParams.delete(PARAM);
    else url.searchParams.set(PARAM, symbol);
    window.history.replaceState(null, '', url);
    setSelectedState(symbol);
  }, []);

  return [selected, setSelected];
}
