import { describe, expect, it } from 'vitest';
import { MockProvider } from './mockProvider';
import { createProvider } from './index';

describe('MockProvider', () => {
  const provider = new MockProvider(() => new Date('2024-06-03T15:00:00Z'));

  it('returns a quote per symbol', async () => {
    const quotes = await provider.getQuotes(['IBM', 'MSFT']);
    expect(quotes.map((q) => q.symbol)).toEqual(['IBM', 'MSFT']);
    expect(quotes[0].name).toBe('IBM');
  });

  it('returns sorted series with enough points for each window', async () => {
    for (const w of ['day', 'week', 'quarter'] as const) {
      const s = await provider.getSeries('IBM', w);
      expect(s.points.length).toBeGreaterThan(2);
      const times = s.points.map((p) => p.time);
      expect([...times].sort()).toEqual(times);
    }
  });

  it('is deterministic for the same symbol', async () => {
    const a = await provider.getSeries('ORCL', 'week');
    const b = await provider.getSeries('ORCL', 'week');
    expect(a).toEqual(b);
  });
});

describe('createProvider', () => {
  it('defaults to the mock provider', () => {
    expect(createProvider(undefined)).toBeInstanceOf(MockProvider);
  });
});
