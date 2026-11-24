import { useCallback, useState } from 'react';
import { DEFAULT_WINDOW, parseTimeWindow } from '../lib/timeWindows';
import type { TimeWindow } from '../types/market';

const PARAM = 'window';

/** Selected time window, kept in the URL (?window=week) so a view can be shared and bookmarked. */
export function useTimeWindow(): [TimeWindow, (next: TimeWindow) => void] {
  const [window_, setWindowState] = useState<TimeWindow>(() =>
    parseTimeWindow(new URLSearchParams(window.location.search).get(PARAM)),
  );

  const setWindow = useCallback((next: TimeWindow) => {
    const url = new URL(window.location.href);
    if (next === DEFAULT_WINDOW) url.searchParams.delete(PARAM);
    else url.searchParams.set(PARAM, next);
    window.history.replaceState(null, '', url);
    setWindowState(next);
  }, []);

  return [window_, setWindow];
}
