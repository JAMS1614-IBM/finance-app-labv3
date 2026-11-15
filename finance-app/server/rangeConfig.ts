import type { TimeWindow } from '../src/domain/types';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export type BarInterval = '5m' | '60m' | '1d';

export interface RangeSpec {
  /** How far back to request, relative to now. */
  lookbackMs: number;
  interval: BarInterval;
}

/**
 * Maps each UI time window to a Yahoo request.
 * The day window looks back 5 days so weekends and holidays still yield a session;
 * normalizeSeries then trims it to the most recent session.
 */
export const RANGES: Record<TimeWindow, RangeSpec> = {
  day: { lookbackMs: 5 * DAY, interval: '5m' },
  week: { lookbackMs: 7 * DAY, interval: '60m' },
  quarter: { lookbackMs: 92 * DAY, interval: '1d' },
};

export function isTimeWindow(value: unknown): value is TimeWindow {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(RANGES, value);
}
