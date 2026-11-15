import { describe, expect, it } from 'vitest';
import { buildChartData, formatTick } from './LineChartView';

describe('buildChartData', () => {
  const p = (time: string, close: number) => ({ time, close });

  it('merges lines onto one sorted time axis and leaves gaps empty', () => {
    const rows = buildChartData([
      { symbol: 'IBM', color: '#000', points: [p('2024-01-01T00:00:00.000Z', 100), p('2024-01-03T00:00:00.000Z', 102)] },
      { symbol: 'BRK.B', color: '#111', points: [p('2024-01-02T00:00:00.000Z', 50)] },
    ]);
    expect(rows.map((r) => r.time)).toEqual([
      '2024-01-01T00:00:00.000Z',
      '2024-01-02T00:00:00.000Z',
      '2024-01-03T00:00:00.000Z',
    ]);
    expect(rows[0]).toEqual({ time: '2024-01-01T00:00:00.000Z', IBM: 100 });
    expect(rows[1]).toEqual({ time: '2024-01-02T00:00:00.000Z', 'BRK.B': 50 });
  });

  it('returns no rows for no lines', () => {
    expect(buildChartData([])).toEqual([]);
  });
});

describe('formatTick', () => {
  const iso = '2024-06-03T14:30:00.000Z';

  it('shows a clock time for the day window', () => {
    expect(formatTick(iso, 'day')).toMatch(/\d{1,2}[:.]\d{2}/);
  });

  it('shows a calendar date, not a clock time, for week and quarter', () => {
    for (const w of ['week', 'quarter'] as const) {
      const out = formatTick(iso, w);
      expect(out).toMatch(/\d/);
      expect(out).not.toMatch(/\d{1,2}:\d{2}/);
    }
  });
});
