import { describe, expect, it } from 'vitest';
import { lastSession, normalizeQuote, normalizeSeries } from './normalize';

const NOW = new Date('2024-06-03T20:00:00Z');

describe('normalizeQuote', () => {
  it('maps a full Yahoo quote', () => {
    const q = normalizeQuote(
      {
        symbol: 'IBM',
        shortName: 'International Business Machines',
        regularMarketPrice: 170.5,
        regularMarketChange: -1.5,
        regularMarketChangePercent: -0.87,
        regularMarketTime: new Date('2024-06-03T19:59:00Z'),
      },
      NOW,
    );
    expect(q).toEqual({
      symbol: 'IBM',
      name: 'International Business Machines',
      price: 170.5,
      change: -1.5,
      changePercent: -0.87,
      asOf: '2024-06-03T19:59:00.000Z',
    });
  });

  it('falls back to longName, then symbol, and defaults missing change to 0', () => {
    expect(normalizeQuote({ symbol: 'X', longName: 'X Corp', regularMarketPrice: 1 }, NOW)).toMatchObject({
      name: 'X Corp',
      change: 0,
      changePercent: 0,
      asOf: NOW.toISOString(),
    });
    expect(normalizeQuote({ symbol: 'X', regularMarketPrice: 1 }, NOW)?.name).toBe('X');
  });

  it('returns null when price is missing or not finite', () => {
    expect(normalizeQuote({ symbol: 'X' }, NOW)).toBeNull();
    expect(normalizeQuote({ symbol: 'X', regularMarketPrice: NaN }, NOW)).toBeNull();
  });
});

describe('normalizeSeries', () => {
  const bars = [
    { date: new Date('2024-05-31T19:55:00Z'), close: 10 },
    { date: new Date('2024-06-03T14:30:00Z'), close: 11 },
    { date: new Date('2024-06-03T14:35:00Z'), close: null },
    { date: new Date('2024-06-03T19:55:00Z'), close: 12 },
  ];

  it('trims the day window to the latest session and drops null closes', () => {
    const s = normalizeSeries('IBM', 'day', bars);
    expect(s.points.map((p) => p.close)).toEqual([11, 12]);
  });

  it('keeps every valid point for week and quarter', () => {
    expect(normalizeSeries('IBM', 'week', bars).points.map((p) => p.close)).toEqual([10, 11, 12]);
    expect(normalizeSeries('IBM', 'quarter', bars).window).toBe('quarter');
  });

  it('ignores bars with invalid dates', () => {
    const s = normalizeSeries('IBM', 'week', [{ date: 'not-a-date', close: 1 }, { date: null, close: 2 }]);
    expect(s.points).toEqual([]);
  });
});

describe('lastSession', () => {
  it('returns an empty array unchanged', () => {
    expect(lastSession([])).toEqual([]);
  });
});
