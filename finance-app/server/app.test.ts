import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app';
import type { MarketClient } from './yahooClient';

const NOW = new Date('2024-06-03T20:00:00Z');

function fakeClient(overrides: Partial<MarketClient> = {}): MarketClient {
  return {
    quotes: vi.fn(async (symbols: string[]) =>
      symbols.map((symbol) => ({
        symbol,
        shortName: `${symbol} Inc`,
        regularMarketPrice: 100,
        regularMarketChange: 1,
        regularMarketChangePercent: 1,
        regularMarketTime: new Date('2024-06-03T19:59:00Z'),
      })),
    ),
    bars: vi.fn(async () => [
      { date: new Date('2024-06-03T14:30:00Z'), close: 100 },
      { date: new Date('2024-06-03T19:55:00Z'), close: 101 },
    ]),
    ...overrides,
  };
}

const app = (client: MarketClient) => createApp(client, { now: () => NOW });

describe('GET /api/quotes', () => {
  it('returns normalized quotes in requested order, accepting lowercase', async () => {
    const res = await request(app(fakeClient())).get('/api/quotes?symbols=msft,ibm');
    expect(res.status).toBe(200);
    expect(res.body.map((q: { symbol: string }) => q.symbol)).toEqual(['MSFT', 'IBM']);
    expect(res.body[0]).toMatchObject({ name: 'MSFT Inc', price: 100 });
  });

  it.each(['', 'IBM,$$$', 'A,B,C,D,E,F,G,H,I,J,K'])('rejects bad symbols %j with 400', async (symbols) => {
    const res = await request(app(fakeClient())).get(`/api/quotes?symbols=${encodeURIComponent(symbols)}`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('returns 404 when no symbol yields a usable price', async () => {
    const client = fakeClient({ quotes: async () => [{ symbol: 'ZZZZ' }] });
    const res = await request(app(client)).get('/api/quotes?symbols=ZZZZ');
    expect(res.status).toBe(404);
  });

  it('returns 502 with a typed error and no upstream detail when Yahoo fails', async () => {
    const client = fakeClient({ quotes: async () => Promise.reject(new Error('secret internal detail')) });
    const res = await request(app(client)).get('/api/quotes?symbols=IBM');
    expect(res.status).toBe(502);
    expect(res.body.code).toBe('UPSTREAM_ERROR');
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });

  it('serves repeat requests from cache', async () => {
    const client = fakeClient();
    const a = app(client);
    await request(a).get('/api/quotes?symbols=IBM');
    await request(a).get('/api/quotes?symbols=IBM');
    expect(client.quotes).toHaveBeenCalledTimes(1);
  });
});

describe('GET /api/history', () => {
  it.each([
    ['day', '5m', 5],
    ['week', '60m', 7],
    ['quarter', '1d', 92],
  ])('maps the %s window to interval %s over %i days', async (window, interval, days) => {
    const client = fakeClient();
    const res = await request(app(client)).get(`/api/history?symbol=ibm&window=${window}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ symbol: 'IBM', window });
    expect(res.body.points).toHaveLength(2);
    const [, from, used] = (client.bars as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(used).toBe(interval);
    expect(NOW.getTime() - (from as Date).getTime()).toBe(days * 24 * 60 * 60 * 1000);
  });

  it('rejects an unknown window or invalid symbol with 400', async () => {
    expect((await request(app(fakeClient())).get('/api/history?symbol=IBM&window=year')).status).toBe(400);
    expect((await request(app(fakeClient())).get('/api/history?symbol=&window=day')).status).toBe(400);
    expect((await request(app(fakeClient())).get('/api/history?symbol=IBM')).status).toBe(400);
  });

  it('accepts index and class-share tickers such as ^GSPC and BRK.B', async () => {
    for (const symbol of ['^GSPC', 'BRK.B']) {
      const res = await request(app(fakeClient())).get(`/api/history?symbol=${encodeURIComponent(symbol)}&window=week`);
      expect(res.status).toBe(200);
      expect(res.body.symbol).toBe(symbol);
    }
  });

  it('returns 404 when the symbol has no history', async () => {
    const client = fakeClient({ bars: async () => [{ date: new Date(), close: null }] });
    const res = await request(app(client)).get('/api/history?symbol=IBM&window=week');
    expect(res.status).toBe(404);
  });

  it('returns 502 when Yahoo fails', async () => {
    const client = fakeClient({ bars: async () => Promise.reject(new Error('rate limited')) });
    const res = await request(app(client)).get('/api/history?symbol=IBM&window=week');
    expect(res.status).toBe(502);
  });
});
