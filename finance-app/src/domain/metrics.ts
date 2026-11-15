import type { PricePoint } from './types';

/** Drops invalid points and returns the rest sorted by time ascending. */
export function normalizePoints(
  raw: Array<{ time: string | Date | null | undefined; close: number | null | undefined }>,
): PricePoint[] {
  return raw
    .filter(
      (p): p is { time: string | Date; close: number } =>
        p.time != null &&
        !Number.isNaN(new Date(p.time).getTime()) &&
        typeof p.close === 'number' &&
        Number.isFinite(p.close),
    )
    .map((p) => ({ time: new Date(p.time).toISOString(), close: p.close }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

/** Percent change from first to last point, or null when fewer than 2 points. */
export function percentChange(points: PricePoint[]): number | null {
  if (points.length < 2 || points[0].close === 0) return null;
  const first = points[0].close;
  const last = points[points.length - 1].close;
  return ((last - first) / first) * 100;
}

/** Rebases a series so the first point equals 100, for fair cross-company comparison. */
export function indexTo100(points: PricePoint[]): PricePoint[] {
  if (points.length === 0 || points[0].close === 0) return [];
  const base = points[0].close;
  return points.map((p) => ({ time: p.time, close: (p.close / base) * 100 }));
}
