import { useQueries, useQuery } from '@tanstack/react-query';
import type { Quote, Series, TimeWindow } from '../domain/types';
import { useDashboard } from './DashboardContext';

export function useQuotes() {
  const { provider, companies } = useDashboard();
  const symbols = companies.map((c) => c.symbol);
  return useQuery<Quote[], Error>({
    queryKey: ['quotes', symbols],
    queryFn: () => provider.getQuotes(symbols),
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
