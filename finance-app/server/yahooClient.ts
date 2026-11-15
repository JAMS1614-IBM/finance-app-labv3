import YahooFinance from 'yahoo-finance2';
import type { RawBar, RawQuote } from '../src/domain/normalize';
import type { BarInterval } from './rangeConfig';

/** The only surface the rest of the server knows about. Swap this to change data vendor. */
export interface MarketClient {
  quotes(symbols: string[]): Promise<RawQuote[]>;
  bars(symbol: string, from: Date, interval: BarInterval): Promise<RawBar[]>;
}

/** The only file that imports yahoo-finance2. */
export function createYahooClient(): MarketClient {
  const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
  return {
    async quotes(symbols) {
      const result = await yf.quote(symbols);
      // Some Yahoo quote variants carry no symbol; they are unusable here.
      return result.filter((q): q is typeof q & RawQuote => typeof q.symbol === 'string');
    },
    async bars(symbol, from, interval) {
      try {
        // Regular trading hours only, so the day view ends at the close.
        const result = await yf.chart(symbol, { period1: from, interval, includePrePost: false });
        return result.quotes;
      } catch (err) {
        // Yahoo throws for unknown or delisted symbols; treat as "no data" so the API returns 404.
        if (err instanceof Error && /no data found/i.test(err.message)) return [];
        throw err;
      }
    },
  };
}
