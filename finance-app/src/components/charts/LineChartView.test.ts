import { describe, expect, it } from 'vitest';
import { formatTick } from './LineChartView';

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
