import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { MarketDataProvider } from '../services';
import { MockProvider } from '../services/mockProvider';
import { DashboardProvider } from '../state/DashboardContext';
import { DashboardPage } from './DashboardPage';

function renderPage(provider: MarketDataProvider) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DashboardProvider provider={provider}>
        <DashboardPage />
      </DashboardProvider>
    </QueryClientProvider>,
  );
}

describe('DashboardPage', () => {
  it('renders a quote card for IBM and each competitor', async () => {
    renderPage(new MockProvider());
    for (const s of ['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM']) {
      expect(await screen.findByRole('article', { name: s })).toBeInTheDocument();
    }
  });

  it('switches the active time window', async () => {
    renderPage(new MockProvider());
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Last Quarter' }));
    expect(screen.getByRole('tab', { name: 'Last Quarter' })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByRole('heading', { name: /Last Quarter$/ })).toBeInTheDocument();
  });

  describe('with the selected-company feature', () => {
    const mainChart = () => screen.getByRole('region', { name: /^Relative performance/ });

    async function pick(user: ReturnType<typeof userEvent.setup>, symbol: string) {
      await user.type(screen.getByLabelText('Company symbol'), symbol);
      await user.click(screen.getByRole('button', { name: 'Show chart' }));
    }

    it('keeps all five quote cards and the main chart when a symbol has no data', async () => {
      renderPage(new MockProvider());
      const user = userEvent.setup();
      for (const s of ['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM']) {
        expect(await screen.findByRole('article', { name: s })).toBeInTheDocument();
      }
      await pick(user, 'ZZZZQ');
      expect(await screen.findByText(/No data available for ZZZZQ/)).toBeInTheDocument();

      expect(screen.getAllByRole('article')).toHaveLength(5);
      expect(within(mainChart()).queryByRole('alert')).not.toBeInTheDocument();
      expect(within(mainChart()).queryByText(/No data:/)).not.toBeInTheDocument();
    });

    it('adds a second chart without adding a sixth quote card or a line to the main chart', async () => {
      renderPage(new MockProvider());
      const user = userEvent.setup();
      await screen.findByRole('article', { name: 'IBM' });
      await pick(user, 'AAPL');
      expect(await screen.findByRole('region', { name: /AAPL vs IBM/ })).toBeInTheDocument();

      expect(screen.getAllByRole('article')).toHaveLength(5);
      expect(screen.queryByRole('article', { name: 'AAPL' })).not.toBeInTheDocument();
      expect(mainChart()).toBeInTheDocument();
    });

    it('does not break the main dashboard when the selected company request fails', async () => {
      const inner = new MockProvider();
      const provider: MarketDataProvider = {
        getQuotes: (s) => inner.getQuotes(s),
        getSeries: (s, w) => (s === 'AAPL' ? Promise.reject(new Error('selected failed')) : inner.getSeries(s, w)),
      };
      renderPage(provider);
      const user = userEvent.setup();
      await screen.findByRole('article', { name: 'IBM' });
      await pick(user, 'AAPL');
      expect(await screen.findByText('selected failed')).toBeInTheDocument();

      expect(screen.getAllByRole('article')).toHaveLength(5);
      expect(within(mainChart()).queryByRole('alert')).not.toBeInTheDocument();
    });

    it('re-targets the selected chart when the time window changes', async () => {
      renderPage(new MockProvider());
      const user = userEvent.setup();
      await screen.findByRole('article', { name: 'IBM' });
      await pick(user, 'AAPL');
      await screen.findByRole('region', { name: 'AAPL vs IBM – Current Day (indexed to 100)' });
      await user.click(screen.getByRole('tab', { name: 'Last Quarter' }));
      expect(await screen.findByRole('region', { name: 'AAPL vs IBM – Last Quarter (indexed to 100)' })).toBeInTheDocument();
    });
  });

  it('shows an error state with retry when the provider fails', async () => {
    const failing: MarketDataProvider = {
      getQuotes: () => Promise.reject(new Error('boom')),
      getSeries: () => Promise.reject(new Error('boom')),
    };
    renderPage(failing);
    const alerts = await screen.findAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/boom|No chart data/).length).toBeGreaterThan(0);
  });
});
