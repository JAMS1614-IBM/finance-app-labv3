import type { MarketDataProvider } from './marketData';
import { MockProvider } from './mockProvider';
import { YahooProxyProvider } from './yahooProxyProvider';

/** Selects the data source. Set VITE_DATA_SOURCE=yahoo to use the proxy; mock is the default. */
export function createProvider(source: string | undefined = import.meta.env.VITE_DATA_SOURCE): MarketDataProvider {
  return source === 'yahoo' ? new YahooProxyProvider() : new MockProvider();
}

export type { MarketDataProvider } from './marketData';
