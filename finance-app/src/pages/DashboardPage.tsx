import { ChartCard } from '../components/cards/ChartCard';
import { QuoteCard } from '../components/cards/QuoteCard';
import { LineChartView, type ChartLine } from '../components/charts/LineChartView';
import { SelectedCompanyPanel } from '../components/company/SelectedCompanyPanel';
import { ErrorState } from '../components/feedback/ErrorState';
import { LoadingState } from '../components/feedback/LoadingState';
import { WindowTabs } from '../components/layout/WindowTabs';
import { TIME_WINDOWS } from '../config/companies';
import { indexTo100 } from '../domain/metrics';
import { useDashboard } from '../state/DashboardContext';
import { useAllSeries, useQuotes } from '../state/queries';

const COLORS = ['#0f62fe', '#8a3ffc', '#009d9a', '#da1e28', '#ff832b'];

export function DashboardPage() {
  const { companies, window, setWindow } = useDashboard();
  const quotes = useQuotes();
  const allSeries = useAllSeries(window);

  const lines: ChartLine[] = [];
  const failed: string[] = [];
  allSeries.forEach((q, i) => {
    const symbol = companies[i].symbol;
    if (q.data && q.data.points.length >= 2) {
      lines.push({ symbol, color: COLORS[i % COLORS.length], points: indexTo100(q.data.points) });
    } else if (q.isError || (q.data && q.data.points.length < 2)) {
      failed.push(symbol);
    }
  });

  const isLoading = allSeries.some((q) => q.isLoading);
  const allFailed = !isLoading && lines.length === 0;
  const firstError = allSeries.find((q) => q.error)?.error ?? null;
  const windowLabel = TIME_WINDOWS.find((w) => w.id === window)?.label ?? '';

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>Market Dashboard</h1>
        <WindowTabs active={window} onChange={setWindow} />
      </header>

      <section aria-label="Quotes" className="grid">
        {quotes.isLoading && <LoadingState label="Loading quotes…" />}
        {quotes.error && <ErrorState message={quotes.error.message} onRetry={() => quotes.refetch()} />}
        {quotes.data?.map((q) => (
          <QuoteCard key={q.symbol} quote={q} highlight={q.symbol === 'IBM'} />
        ))}
      </section>

      <ChartCard
        title={`Relative performance (indexed to 100) – ${windowLabel}`}
        subtitle={failed.length ? `No data: ${failed.join(', ')}` : undefined}
        isLoading={isLoading}
        error={allFailed ? (firstError ?? new Error('No chart data available for this window')) : null}
        onRetry={() => allSeries.forEach((q) => q.refetch())}
      >
        <LineChartView lines={lines} window={window} />
      </ChartCard>

      <SelectedCompanyPanel />

      <footer className="muted disclaimer">Data may be delayed. Not investment advice.</footer>
    </main>
  );
}
