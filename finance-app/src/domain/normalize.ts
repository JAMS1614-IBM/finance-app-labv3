import { normalizePoints } from './metrics';
import type { PricePoint, Quote, Series, TimeWindow } from './types';

/** Minimal subset of a Yahoo quote that we depend on. Everything is optional on purpose. */
export interface RawQuote {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketTime?: Date | string | number;
}

/** Minimal subset of a Yahoo chart bar. */
export interface RawBar {
  date: Date | string | number | null;
  close: number | null;
}

const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/**
 * Maps a raw Yahoo quote to the domain Quote.
 * Returns null when there is no usable price. A missing change is reported as 0
 * rather than dropping the whole quote, so a partial payload still renders.
 */
export function normalizeQuote(raw: RawQuote, now: Date = new Date()): Quote | null {
  if (!isNum(raw.regularMarketPrice)) return null;
  const asOf = raw.regularMarketTime != null ? new Date(raw.regularMarketTime) : now;
  return {
    symbol: raw.symbol,
    name: raw.shortName ?? raw.longName ?? raw.symbol,
    price: raw.regularMarketPrice,
    change: isNum(raw.regularMarketChange) ? raw.regularMarketChange : 0,
    changePercent: isNum(raw.regularMarketChangePercent) ? raw.regularMarketChangePercent : 0,
    asOf: (Number.isNaN(asOf.getTime()) ? now : asOf).toISOString(),
  };
}

/** Keeps only the most recent trading session (points within `gapMs` of the last point). */
export function lastSession(points: PricePoint[], gapMs: number = 12 * 60 * 60 * 1000): PricePoint[] {
  if (points.length === 0) return points;
  const cutoff = new Date(points[points.length - 1].time).getTime() - gapMs;
  return points.filter((p) => new Date(p.time).getTime() >= cutoff);
}

/** Maps raw chart bars to a clean, sorted Series. The day view is trimmed to the latest session. */
export function normalizeSeries(symbol: string, window: TimeWindow, bars: RawBar[]): Series {
  const points = normalizePoints(bars.map((b) => ({ time: b.date as string | Date | null, close: b.close })));
  return { symbol, window, points: window === 'day' ? lastSession(points) : points };
}
