import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Quote } from '../../domain/types';
import { ErrorState } from '../feedback/ErrorState';
import { WindowTabs } from '../layout/WindowTabs';
import { ChartCard } from './ChartCard';
import { QuoteCard } from './QuoteCard';

const quote = (over: Partial<Quote> = {}): Quote => ({
  symbol: 'IBM',
  name: 'International Business Machines',
  price: 170.5,
  change: 1.234,
  changePercent: 0.7299,
  asOf: '2024-06-03T20:00:00.000Z',
  ...over,
});

describe('QuoteCard', () => {
  it('formats price and a positive change with a plus sign', () => {
    render(<QuoteCard quote={quote()} />);
    expect(screen.getByText('$170.50')).toBeInTheDocument();
    const change = screen.getByText('+1.23 (+0.73%)');
    expect(change).toHaveClass('up');
  });

  it('formats a negative change without a plus sign', () => {
    render(<QuoteCard quote={quote({ change: -2, changePercent: -1.17 })} />);
    const change = screen.getByText('-2.00 (-1.17%)');
    expect(change).toHaveClass('down');
  });

  it('treats zero change as up and marks the highlighted card', () => {
    render(<QuoteCard quote={quote({ change: 0, changePercent: 0 })} highlight />);
    expect(screen.getByText('+0.00 (+0.00%)')).toHaveClass('up');
    expect(screen.getByRole('article', { name: 'IBM' })).toHaveClass('quote-highlight');
  });
});

describe('ChartCard', () => {
  it('renders children when idle', () => {
    render(
      <ChartCard title="T">
        <p>chart body</p>
      </ChartCard>,
    );
    expect(screen.getByText('chart body')).toBeInTheDocument();
  });

  it('shows a loading status instead of children', () => {
    render(
      <ChartCard title="T" isLoading>
        <p>chart body</p>
      </ChartCard>,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('chart body')).not.toBeInTheDocument();
  });

  it('shows the error with a working Retry, and error wins over loading', async () => {
    const onRetry = vi.fn();
    render(
      <ChartCard title="T" isLoading error={new Error('boom')} onRetry={onRetry}>
        <p>chart body</p>
      </ChartCard>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('boom');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders the optional subtitle', () => {
    render(
      <ChartCard title="T" subtitle="No data: MSFT">
        <p>x</p>
      </ChartCard>,
    );
    expect(screen.getByText('No data: MSFT')).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('omits the Retry button when no handler is given', () => {
    render(<ErrorState message="nope" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('WindowTabs', () => {
  it('marks only the active tab and reports clicks', async () => {
    const onChange = vi.fn();
    render(<WindowTabs active="week" onChange={onChange} />);
    expect(screen.getByRole('tab', { name: 'Last 7 Days' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Current Day' })).toHaveAttribute('aria-selected', 'false');
    await userEvent.click(screen.getByRole('tab', { name: 'Last Quarter' }));
    expect(onChange).toHaveBeenCalledWith('quarter');
  });
});
