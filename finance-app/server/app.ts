import express, { type Express, type Response } from 'express';
import { normalizeQuote, normalizeSeries } from '../src/domain/normalize';
import type { Quote, Series } from '../src/domain/types';
import { TtlCache } from './cache';
import { isTimeWindow, RANGES } from './rangeConfig';
import type { MarketClient } from './yahooClient';

/** Any ticker-like string. Adding a company never requires a server change. */
const SYMBOL_RE = /^[A-Z0-9][A-Z0-9.^=-]{0,11}$/;
const MAX_SYMBOLS = 10;

export interface ApiError {
  code: 'BAD_REQUEST' | 'NOT_FOUND' | 'UPSTREAM_ERROR';
  message: string;
}

export interface AppOptions {
  now?: () => Date;
  cacheTtlMs?: number;
}

function fail(res: Response, status: number, code: ApiError['code'], message: string) {
  res.status(status).json({ code, message } satisfies ApiError);
}

export function createApp(client: MarketClient, options: AppOptions = {}): Express {
  const now = options.now ?? (() => new Date());
  const ttl = options.cacheTtlMs ?? 60_000;
  const quoteCache = new TtlCache<Quote[]>(ttl);
  const seriesCache = new TtlCache<Series>(ttl);

  const app = express();

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/quotes', async (req, res) => {
    const symbols = String(req.query.symbols ?? '')
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    if (symbols.length === 0 || symbols.length > MAX_SYMBOLS || !symbols.every((s) => SYMBOL_RE.test(s))) {
      return fail(res, 400, 'BAD_REQUEST', `Provide 1-${MAX_SYMBOLS} valid, comma-separated symbols`);
    }
    try {
      const quotes = await quoteCache.getOrLoad(symbols.join(','), async () => {
        const raw = await client.quotes(symbols);
        return raw.map((r) => normalizeQuote(r, now())).filter((q): q is Quote => q !== null);
      });
      if (quotes.length === 0) return fail(res, 404, 'NOT_FOUND', 'No quotes found for the requested symbols');
      // Preserve the caller's order so the UI can rely on it.
      res.json([...quotes].sort((a, b) => symbols.indexOf(a.symbol) - symbols.indexOf(b.symbol)));
    } catch {
      fail(res, 502, 'UPSTREAM_ERROR', 'Market data provider request failed');
    }
  });

  app.get('/api/history', async (req, res) => {
    const symbol = String(req.query.symbol ?? '').trim().toUpperCase();
    const window = req.query.window;
    if (!SYMBOL_RE.test(symbol)) return fail(res, 400, 'BAD_REQUEST', 'A valid symbol is required');
    if (!isTimeWindow(window)) return fail(res, 400, 'BAD_REQUEST', 'window must be one of: day, week, quarter');
    try {
      const spec = RANGES[window];
      const series = await seriesCache.getOrLoad(`${symbol}|${window}`, async () => {
        const from = new Date(now().getTime() - spec.lookbackMs);
        return normalizeSeries(symbol, window, await client.bars(symbol, from, spec.interval));
      });
      if (series.points.length === 0) return fail(res, 404, 'NOT_FOUND', `No price history found for ${symbol}`);
      res.json(series);
    } catch {
      fail(res, 502, 'UPSTREAM_ERROR', 'Market data provider request failed');
    }
  });

  return app;
}
