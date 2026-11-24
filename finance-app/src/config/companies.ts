import type { Company } from '../types/market';

/** IBM plus at most this many competitors. */
export const MAX_COMPETITORS = 4;

/**
 * Company registry: the single place to add or change tracked companies.
 * The first entry is the primary company (IBM); the rest are competitors.
 */
export const COMPANIES: readonly Company[] = [
  { symbol: 'IBM', name: 'IBM', color: '#0f62fe', isPrimary: true },
  { symbol: 'MSFT', name: 'Microsoft', color: '#198038' },
  { symbol: 'ORCL', name: 'Oracle', color: '#da1e28' },
  { symbol: 'SAP', name: 'SAP', color: '#8a3ffc' },
  { symbol: 'CRM', name: 'Salesforce', color: '#b28600' },
];

export const COMPANY_SYMBOLS: readonly string[] = COMPANIES.map((company) => company.symbol);

export function findCompany(symbol: string): Company | undefined {
  return COMPANIES.find((company) => company.symbol === symbol);
}
