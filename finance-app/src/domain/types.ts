export type TimeWindow = 'day' | 'week' | 'quarter';

export interface Company {
  symbol: string;
  name: string;
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  asOf: string;
}

export interface PricePoint {
  /** ISO timestamp */
  time: string;
  close: number;
}

export interface Series {
  symbol: string;
  window: TimeWindow;
  points: PricePoint[];
}
