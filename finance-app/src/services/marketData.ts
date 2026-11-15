import type { Quote, Series, TimeWindow } from '../domain/types';

/**
 * Contract between the UI and any market data source.
 * Implementations must throw an Error with a readable message on failure.
 */
export interface MarketDataProvider {
  getQuotes(symbols: string[]): Promise<Quote[]>;
  getSeries(symbol: string, window: TimeWindow): Promise<Series>;
}
