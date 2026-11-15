import { describe, expect, it } from 'vitest';
import { YahooProxyProvider } from './yahooProxyProvider';

function stubFetch(handler: (url: string) => Response | Promise<Response>) {
  globalThis.fetch = ((url: string) => Promise.resolve(handler(url))) as typeof fetch;
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('YahooProxyProvider', () => {
  it('requests quotes with an encoded symbol list', async () => {
    let seen = '';
    stubFetch((url) => ((seen = url), json([])));
    await new YahooProxyProvider().getQuotes(['IBM', 'MSFT']);
    expect(seen).toBe('/api/quotes?symbols=IBM%2CMSFT');
  });

  it('re-normalizes history points', async () => {
    stubFetch(() =>
      json({
        symbol: 'IBM',
        window: 'week',
        points: [
          { time: '2024-06-02T00:00:00Z', close: 2 },
          { time: '2024-06-01T00:00:00Z', close: 1 },
          { time: '2024-06-03T00:00:00Z', close: null },
        ],
      }),
    );
    const s = await new YahooProxyProvider().getSeries('IBM', 'week');
    expect(s.points.map((p) => p.close)).toEqual([1, 2]);
  });

  it('surfaces the server error message on a non-2xx response', async () => {
    stubFetch(() => json({ code: 'NOT_FOUND', message: 'No price history found for ZZZZ' }, 404));
    await expect(new YahooProxyProvider().getSeries('ZZZZ', 'day')).rejects.toThrow('No price history found for ZZZZ');
  });

  it('explains that the proxy is down when a 5xx has no JSON body', async () => {
    stubFetch(() => new Response('', { status: 500 }));
    await expect(new YahooProxyProvider().getQuotes(['IBM'])).rejects.toThrow('npm run proxy');
  });

  it('reports an unreachable service on network failure', async () => {
    globalThis.fetch = (() => Promise.reject(new TypeError('failed'))) as typeof fetch;
    await expect(new YahooProxyProvider().getQuotes(['IBM'])).rejects.toThrow('unreachable');
  });
});
