import type { ReactNode } from 'react';
import { ErrorState } from '../feedback/ErrorState';
import { LoadingState } from '../feedback/LoadingState';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  children: ReactNode;
}

/** Reusable frame for any chart: title plus consistent loading and error handling. */
export function ChartCard({ title, subtitle, isLoading, error, onRetry, children }: ChartCardProps) {
  return (
    <section className="card" aria-label={title}>
      <header className="card-header">
        <h3>{title}</h3>
        {subtitle && <span className="muted">{subtitle}</span>}
      </header>
      {error ? (
        <ErrorState message={error.message} onRetry={onRetry} />
      ) : isLoading ? (
        <LoadingState />
      ) : (
        children
      )}
    </section>
  );
}
