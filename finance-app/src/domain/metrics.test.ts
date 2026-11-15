import { describe, expect, it } from 'vitest';
import { indexTo100, normalizePoints, percentChange } from './metrics';

describe('normalizePoints', () => {
  it('drops null and non-finite values and sorts by time', () => {
    const out = normalizePoints([
      { time: '2024-01-02T00:00:00Z', close: 11 },
      { time: '2024-01-01T00:00:00Z', close: 10 },
      { time: '2024-01-03T00:00:00Z', close: null },
      { time: null, close: 5 },
      { time: '2024-01-04T00:00:00Z', close: NaN },
    ]);
    expect(out.map((p) => p.close)).toEqual([10, 11]);
  });
});

describe('percentChange', () => {
  it('computes first-to-last change', () => {
    expect(
      percentChange([
        { time: 'a', close: 100 },
        { time: 'b', close: 110 },
      ]),
    ).toBeCloseTo(10);
  });
  it('returns null with fewer than 2 points', () => {
    expect(percentChange([{ time: 'a', close: 100 }])).toBeNull();
  });
});

describe('indexTo100', () => {
  it('rebases the first point to 100', () => {
    const out = indexTo100([
      { time: 'a', close: 50 },
      { time: 'b', close: 75 },
    ]);
    expect(out.map((p) => p.close)).toEqual([100, 150]);
  });
  it('returns empty for empty input', () => {
    expect(indexTo100([])).toEqual([]);
  });
});
