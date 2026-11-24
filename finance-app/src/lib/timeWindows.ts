import type { TimeWindow } from '../types/market';

export interface TimeWindowConfig {
  id: TimeWindow;
  label: string;
  description: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Display order of the views. */
export const TIME_WINDOWS: readonly TimeWindowConfig[] = [
  { id: 'day', label: 'Today', description: 'Current trading day' },
  { id: 'week', label: 'Last 7 days', description: 'Trailing 7 days' },
  { id: 'quarter', label: 'Last quarter', description: 'Trailing 3 months' },
];

/** Trailing span of each window in milliseconds. The day window is one trading session, not 24h. */
export const TRADING_SESSION_MS = 6.5 * 60 * 60 * 1000;
export const WINDOW_SPAN_MS: Record<TimeWindow, number> = {
  day: TRADING_SESSION_MS,
  week: 7 * DAY_MS,
  quarter: 90 * DAY_MS,
};

export const DEFAULT_WINDOW: TimeWindow = 'day';

export function isTimeWindow(value: unknown): value is TimeWindow {
  return TIME_WINDOWS.some((entry) => entry.id === value);
}

/** Parses a query-string value, falling back to the default for anything unknown. */
export function parseTimeWindow(value: string | null): TimeWindow {
  return isTimeWindow(value) ? value : DEFAULT_WINDOW;
}

export function getWindowLabel(window: TimeWindow): string {
  return TIME_WINDOWS.find((entry) => entry.id === window)?.label ?? window;
}
