import { DEFAULT_COMPANIES } from '../config/companies';
import { normalizePoints } from '../domain/metrics';
import type { Quote, Series, TimeWindow } from '../domain/types';
import type { MarketDataProvider } from './marketData';

const POINTS: Record<TimeWindow, { count: number; stepMs: number }> = {
  day: { count: 78, stepMs: 5 * 60 * 1000 },
  week: { count: 35, stepMs: 60 * 60 * 1000 },
  quarter: { count: 63, stepMs: 24 * 60 * 60 * 1000 },
};

/** Deterministic hash so the same symbol always yields the same shape. */
function seed(symbol: string): number {
  return [...symbol].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 9973, 7);
}

function basePrice(symbol: string): number {
  return 80 + (seed(symbol) % 320);
}

/** Offline provider with synthetic data for demos, tests, and Yahoo outages. */
export class MockProvider implements MarketDataProvider {
  constructor(private readonly now: () => Date = () => new Date()) {}

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    return symbols.map((symbol) => {
      const price = basePrice(symbol);
      const change = ((seed(symbol) % 11) - 5) * 0.4;
      const name = DEFAULT_COMPANIES.find((c) => c.symbol === symbol)?.name ?? symbol;
      return {
        symbol,
        name,
        price,
        change,
        changePercent: (change / price) * 100,
        asOf: this.now().toISOString(),
      };
    });
  }

  async getSeries(symbol: string, window: TimeWindow): Promise<Series> {
    const { count, stepMs } = POINTS[window];
    const s = seed(symbol);
    const end = this.now().getTime();
    const raw = Array.from({ length: count }, (_, i) => ({
      time: new Date(end - (count - 1 - i) * stepMs),
      close: basePrice(symbol) + Math.sin((i + s) / 5) * 4 + (i / count) * ((s % 7) - 3),
    }));
    return { symbol, window, points: normalizePoints(raw) };
  }
}
