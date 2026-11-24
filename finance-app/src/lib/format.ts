import type { TimeWindow } from '../types/market';

export function formatPrice(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

export function formatSigned(value: number, fractionDigits = 2): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${Math.abs(value).toFixed(fractionDigits)}`;
}

export function formatPercent(value: number): string {
  return `${formatSigned(value)}%`;
}

/** Axis tick label; the detail level depends on the window. */
export function formatTick(epochMs: number, window: TimeWindow): string {
  const date = new Date(epochMs);
  if (window === 'day') {
    return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(date);
  }
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

export function formatDateTime(epochMs: number): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(epochMs));
}
