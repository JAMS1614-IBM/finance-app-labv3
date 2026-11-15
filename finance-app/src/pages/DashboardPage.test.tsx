import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
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
