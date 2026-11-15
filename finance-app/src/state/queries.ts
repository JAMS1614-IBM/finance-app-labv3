import { useQueries, useQuery } from '@tanstack/react-query';
import { NoDataError } from '../domain/errors';
import type { Quote, Series, TimeWindow } from '../domain/types';
import { useDashboard } from './DashboardContext';

/** Retry once for transient failures, but never when a symbol simply has no data. */
export function shouldRetry(failureCount: number, error: Error): boolean {
  return !(error instanceof NoDataError) && failureCount < 1;
}

export function useQuotes() {
  const { provider, companies } = useDashboard();
  const symbols = companies.map((c) => c.symbol);
  return useQuery<Quote[], Error>({
    queryKey: ['quotes', symbols],
    queryFn: () => provider.getQuotes(symbols),
    staleTime: 60_000,
  });
}

/**
 * Series for a single, user-chosen symbol. Idle while `symbol` is null.
 * Shares the ['series', symbol, window] cache key with useAllSeries, so a symbol
 * already on the main chart (such as IBM) is not fetched twice.
 */
export function useSelectedSeries(symbol: string | null, window: TimeWindow) {
  const { provider } = useDashboard();
  return useQuery<Series, Error>({
    queryKey: ['series', symbol, window],
    queryFn: () => provider.getSeries(symbol as string, window),
    enabled: symbol !== null,
    staleTime: 60_000,
  });
}

/** One independent query per symbol, so a single failure does not blank the others. */
export function useAllSeries(window: TimeWindow) {
  const { provider, companies } = useDashboard();
  return useQueries({
    queries: companies.map((c) => ({
      queryKey: ['series', c.symbol, window],
      queryFn: (): Promise<Series> => provider.getSeries(c.symbol, window),
      staleTime: 60_000,
    })),
  });
}
