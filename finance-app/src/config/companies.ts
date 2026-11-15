import type { Company, TimeWindow } from '../domain/types';

export const MAX_COMPANIES = 5;

/** IBM first, then up to four competitors. Add or remove entries here only. */
export const DEFAULT_COMPANIES: Company[] = [
  { symbol: 'IBM', name: 'IBM' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'ORCL', name: 'Oracle' },
  { symbol: 'SAP', name: 'SAP' },
  { symbol: 'CRM', name: 'Salesforce' },
];

export const TIME_WINDOWS: { id: TimeWindow; label: string }[] = [
  { id: 'day', label: 'Current Day' },
  { id: 'week', label: 'Last 7 Days' },
  { id: 'quarter', label: 'Last Quarter' },
];
