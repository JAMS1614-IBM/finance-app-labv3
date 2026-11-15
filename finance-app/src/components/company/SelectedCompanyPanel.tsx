import { useState, type FormEvent } from 'react';
import { TIME_WINDOWS } from '../../config/companies';
import { NoDataError } from '../../domain/errors';
import { indexTo100 } from '../../domain/metrics';
import { isValidSymbol, normalizeSymbol } from '../../domain/symbol';
import { useDashboard } from '../../state/DashboardContext';
import { useSelectedSeries } from '../../state/queries';
import { ChartCard } from '../cards/ChartCard';
import { LineChartView, type ChartLine } from '../charts/LineChartView';

const SELECTED_COLOR = '#8a3ffc';
const BASELINE_COLOR = '#0f62fe';

/**
 * Lets the user pick any ticker and compares it with the first dashboard company (IBM).
 * Independent of the main dashboard: it has its own state and queries and never edits
 * the company list, so the quote cards and main chart are unaffected by anything here.
 */
export function SelectedCompanyPanel() {
  const { companies, window } = useDashboard();
  const baseline = companies[0];
  const [draft, setDraft] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const selectedSeries = useSelectedSeries(selected, window);
  const baselineSeries = useSelectedSeries(selected ? baseline.symbol : null, window);
  const windowLabel = TIME_WINDOWS.find((w) => w.id === window)?.label ?? '';

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const symbol = normalizeSymbol(draft);
    if (symbol === '') {
      setInputError('Enter a ticker symbol, for example MSFT.');
    } else if (!isValidSymbol(symbol)) {
      setInputError(`"${draft.trim()}" is not a valid ticker symbol.`);
    } else {
      setInputError(null);
      setDraft(symbol);
      setSelected(symbol);
    }
  }

  const lines: ChartLine[] = [];
  let error: Error | null = null;
  let subtitle: string | undefined;
  let onRetry: (() => void) | undefined;

  if (selected) {
    const points = selectedSeries.data?.points ?? [];
    if (selectedSeries.error instanceof NoDataError || (selectedSeries.data && points.length < 2)) {
      // No data for the chosen company: say so. Never substitute another company's data.
      error = new Error(`No data available for ${selected} (${windowLabel}). Check the symbol and try again.`);
    } else if (selectedSeries.error) {
      error = selectedSeries.error;
      onRetry = () => selectedSeries.refetch();
    } else if (selectedSeries.data) {
      lines.push({ symbol: selected, color: SELECTED_COLOR, points: indexTo100(points) });
      if (selected !== baseline.symbol) {
        const basePoints = baselineSeries.data?.points ?? [];
        if (basePoints.length >= 2) {
          lines.unshift({ symbol: baseline.symbol, color: BASELINE_COLOR, points: indexTo100(basePoints) });
        } else if (!baselineSeries.isLoading) {
          subtitle = `${baseline.symbol} comparison unavailable`;
        }
      }
    }
  }

  const isLoading = selected !== null && selectedSeries.isLoading;
  const compare = selected && selected !== baseline.symbol ? `${selected} vs ${baseline.symbol}` : selected;

  return (
    <section aria-label="Compare a company" className="selected-company">
      <form onSubmit={onSubmit} className="selected-form" noValidate>
        <label htmlFor="company-symbol">Company symbol</label>
        <input
          id="company-symbol"
          list="company-suggestions"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. AAPL"
          autoComplete="off"
          aria-invalid={inputError !== null}
          aria-describedby={inputError ? 'company-symbol-error' : undefined}
        />
        <datalist id="company-suggestions">
          {companies.map((c) => (
            <option key={c.symbol} value={c.symbol}>
              {c.name}
            </option>
          ))}
        </datalist>
        <button type="submit">Show chart</button>
      </form>
      {inputError && (
        <p id="company-symbol-error" role="alert" className="state state-error">
          {inputError}
        </p>
      )}

      {selected && (
        <ChartCard
          title={`${compare} – ${windowLabel} (indexed to 100)`}
          subtitle={subtitle}
          isLoading={isLoading}
          error={error}
          onRetry={onRetry}
        >
          <LineChartView lines={lines} window={window} />
        </ChartCard>
      )}
    </section>
  );
}
