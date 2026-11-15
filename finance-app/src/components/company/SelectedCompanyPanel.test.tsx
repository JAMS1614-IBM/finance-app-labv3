import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NoDataError } from '../../domain/errors';
import type { Series, TimeWindow } from '../../domain/types';
import type { MarketDataProvider } from '../../services';
import { MockProvider } from '../../services/mockProvider';
import { DashboardProvider } from '../../state/DashboardContext';
import { shouldRetry } from '../../state/queries';
import { SelectedCompanyPanel } from './SelectedCompanyPanel';

function setup(provider: MarketDataProvider = new MockProvider()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: shouldRetry, retryDelay: 0 } } });
  render(
    <QueryClientProvider client={client}>
      <DashboardProvider provider={provider}>
        <SelectedCompanyPanel />
      </DashboardProvider>
    </QueryClientProvider>,
  );
  return { user: userEvent.setup() };
}

async function submit(user: ReturnType<typeof userEvent.setup>, text: string) {
  const input = screen.getByLabelText('Company symbol');
  await user.clear(input);
  if (text) await user.type(input, text);
  await user.click(screen.getByRole('button', { name: 'Show chart' }));
}

/** Wraps a provider and records every getSeries call. */
function spy(inner: MarketDataProvider) {
  const getSeries = vi.fn((s: string, w: TimeWindow) => inner.getSeries(s, w));
  return { provider: { getQuotes: (s: string[]) => inner.getQuotes(s), getSeries }, getSeries };
}

describe('SelectedCompanyPanel', () => {
  it('renders no chart until a symbol is submitted', () => {
    setup();
    expect(screen.getByLabelText('Company symbol')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /vs IBM/ })).not.toBeInTheDocument();
  });

  it('shows a chart for a valid symbol, compared against IBM, for the active window', async () => {
    const { provider, getSeries } = spy(new MockProvider());
    const { user } = setup(provider);
    await submit(user, ' aapl ');
    expect(await screen.findByRole('region', { name: 'AAPL vs IBM – Current Day (indexed to 100)' })).toBeInTheDocument();
    expect(getSeries).toHaveBeenCalledWith('AAPL', 'day');
    expect(getSeries).toHaveBeenCalledWith('IBM', 'day');
  });

  it('shows a loading state while the data is being fetched', async () => {
    const never: MarketDataProvider = {
      getQuotes: async () => [],
      getSeries: () => new Promise<Series>(() => {}),
    };
    const { user } = setup(never);
    await submit(user, 'AAPL');
    expect(await screen.findByRole('status')).toBeInTheDocument();
  });

  it('rejects an empty submission with a message and makes no request', async () => {
    const { provider, getSeries } = spy(new MockProvider());
    const { user } = setup(provider);
    await submit(user, '');
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a ticker symbol');
    expect(getSeries).not.toHaveBeenCalled();
  });

  it('rejects a malformed symbol with a message and makes no request', async () => {
    const { provider, getSeries } = spy(new MockProvider());
    const { user } = setup(provider);
    await submit(user, '$$$');
    expect(await screen.findByRole('alert')).toHaveTextContent('"$$$" is not a valid ticker symbol');
    expect(screen.getByLabelText('Company symbol')).toHaveAttribute('aria-invalid', 'true');
    expect(getSeries).not.toHaveBeenCalled();
  });

  it('shows a clear no-data message for an unknown symbol, and never falls back to another company', async () => {
    const { provider, getSeries } = spy(new MockProvider());
    const { user } = setup(provider);
    await submit(user, 'zzzzq');
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No data available for ZZZZQ (Current Day). Check the symbol and try again.');
    // No retry button: "no data" is not a transient failure.
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    // IBM is never fetched as a stand-in, and nothing else is plotted.
    expect(getSeries).toHaveBeenCalledTimes(2);
    expect(getSeries).toHaveBeenCalledWith('ZZZZQ', 'day');
    expect(document.querySelector('.recharts-responsive-container')).toBeNull();
  });

  it('treats a series with fewer than two points as no data', async () => {
    const sparse: MarketDataProvider = {
      getQuotes: async () => [],
      getSeries: async (symbol, window) => ({ symbol, window, points: [{ time: '2024-01-01T00:00:00Z', close: 1 }] }),
    };
    const { user } = setup(sparse);
    await submit(user, 'AAPL');
    expect(await screen.findByRole('alert')).toHaveTextContent('No data available for AAPL');
  });

  it('shows an error with Retry for a transient failure, and Retry recovers', async () => {
    const inner = new MockProvider();
    let fail = true;
    const flaky: MarketDataProvider = {
      getQuotes: (s) => inner.getQuotes(s),
      getSeries: (s, w) => (fail && s === 'AAPL' ? Promise.reject(new Error('Market data service is unreachable')) : inner.getSeries(s, w)),
    };
    const { user } = setup(flaky);
    await submit(user, 'AAPL');
    expect(await screen.findByRole('alert')).toHaveTextContent('Market data service is unreachable');
    fail = false;
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('region', { name: /AAPL vs IBM/ })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('plots a single line when the selected symbol is the baseline itself', async () => {
    const { user } = setup();
    await submit(user, 'IBM');
    expect(await screen.findByRole('region', { name: 'IBM – Current Day (indexed to 100)' })).toBeInTheDocument();
  });

  it('still charts the selected company when the IBM comparison is unavailable', async () => {
    const inner = new MockProvider();
    const noIbm: MarketDataProvider = {
      getQuotes: (s) => inner.getQuotes(s),
      getSeries: (s, w) => (s === 'IBM' ? Promise.reject(new NoDataError('IBM')) : inner.getSeries(s, w)),
    };
    const { user } = setup(noIbm);
    await submit(user, 'AAPL');
    expect(await screen.findByText('IBM comparison unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
