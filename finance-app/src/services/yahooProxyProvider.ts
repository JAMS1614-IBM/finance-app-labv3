import { normalizePoints } from '../domain/metrics';
import type { Quote, Series, TimeWindow } from '../domain/types';
import type { MarketDataProvider } from './marketData';

/**
 * Talks to a backend proxy that wraps Yahoo Finance (browsers cannot call Yahoo directly).
 * Expected endpoints:
 *   GET {base}/quotes?symbols=IBM,MSFT      -> Quote[]
 *   GET {base}/history?symbol=IBM&window=day -> { symbol, window, points: [{ time, close }] }
 * The proxy lives in /server (run with `npm run dev`; Vite forwards /api to it).
 */
export class YahooProxyProvider implements MarketDataProvider {
  constructor(private readonly baseUrl: string = '/api') {}

  private async getJson<T>(path: string): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`);
    } catch {
      throw new Error('Market data service is unreachable');
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (body?.message) throw new Error(body.message);
      // A 5xx with no JSON body means the proxy itself did not answer (e.g. Vite could not reach it).
      if (res.status >= 500) {
        throw new Error(`Market data proxy is not responding (${res.status}). Start it with "npm run proxy".`);
      }
      throw new Error(`Market data request failed (${res.status})`);
    }
    return (await res.json()) as T;
  }

  getQuotes(symbols: string[]): Promise<Quote[]> {
    return this.getJson<Quote[]>(`/quotes?symbols=${encodeURIComponent(symbols.join(','))}`);
  }

  async getSeries(symbol: string, window: TimeWindow): Promise<Series> {
    const data = await this.getJson<Series>(
      `/history?symbol=${encodeURIComponent(symbol)}&window=${window}`,
    );
    return { symbol, window, points: normalizePoints(data.points) };
  }
}
