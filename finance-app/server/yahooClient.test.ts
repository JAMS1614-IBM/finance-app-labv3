import { beforeEach, describe, expect, it, vi } from 'vitest';

const { quoteMock, chartMock } = vi.hoisted(() => ({ quoteMock: vi.fn(), chartMock: vi.fn() }));

vi.mock('yahoo-finance2', () => ({
  default: class {
    quote = quoteMock;
    chart = chartMock;
  },
}));

import { createYahooClient } from './yahooClient';

beforeEach(() => {
  quoteMock.mockReset();
  chartMock.mockReset();
});

describe('createYahooClient', () => {
  it('drops quote entries that carry no symbol', async () => {
    quoteMock.mockResolvedValue([{ symbol: 'IBM', regularMarketPrice: 1 }, { regularMarketPrice: 2 }]);
    const out = await createYahooClient().quotes(['IBM', 'X']);
    expect(out.map((q) => q.symbol)).toEqual(['IBM']);
  });

  it('requests regular-hours bars from the given start and interval', async () => {
    const bars = [{ date: new Date('2024-06-03T14:30:00Z'), close: 1 }];
    chartMock.mockResolvedValue({ quotes: bars });
    const from = new Date('2024-06-01T00:00:00Z');
    const out = await createYahooClient().bars('IBM', from, '5m');
    expect(out).toBe(bars);
    expect(chartMock).toHaveBeenCalledWith('IBM', { period1: from, interval: '5m', includePrePost: false });
  });

  it('treats "No data found" as empty history so the API can answer 404', async () => {
    chartMock.mockRejectedValue(new Error('No data found, symbol may be delisted'));
    await expect(createYahooClient().bars('ZZZZ', new Date(), '1d')).resolves.toEqual([]);
  });

  it('rethrows any other upstream failure', async () => {
    chartMock.mockRejectedValue(new Error('Too Many Requests'));
    await expect(createYahooClient().bars('IBM', new Date(), '1d')).rejects.toThrow('Too Many Requests');
  });
});
