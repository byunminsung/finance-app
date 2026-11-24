import type { Company } from '../types/market';
import { COMPANIES } from './companies';

/**
 * Extra symbols the user can look up. Deliberately separate from COMPANIES: that registry
 * drives the IBM-vs-competitors dashboards and its "IBM + max 4 competitors" rule.
 */
export const ADDITIONAL_COMPANIES: readonly Company[] = [
  { symbol: 'AAPL', name: 'Apple', color: '#525252' },
  { symbol: 'GOOGL', name: 'Alphabet', color: '#ff832b' },
  { symbol: 'AMZN', name: 'Amazon', color: '#d12771' },
  { symbol: 'NVDA', name: 'NVIDIA', color: '#007d79' },
  { symbol: 'INTC', name: 'Intel', color: '#9f1853' },
  { symbol: 'CSCO', name: 'Cisco', color: '#6929c4' },
];

/** Everything the lookup box suggests and the chart can label: tracked companies plus extras. */
export const CATALOG: readonly Company[] = [...COMPANIES, ...ADDITIONAL_COMPANIES];

export function findListedCompany(symbol: string): Company | undefined {
  return CATALOG.find((company) => company.symbol === symbol);
}
