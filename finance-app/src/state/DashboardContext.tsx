import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_COMPANIES } from '../config/companies';
import type { Company, TimeWindow } from '../domain/types';
import type { MarketDataProvider } from '../services';

interface DashboardState {
  provider: MarketDataProvider;
  companies: Company[];
  window: TimeWindow;
  setWindow: (w: TimeWindow) => void;
}

const DashboardContext = createContext<DashboardState | null>(null);

export function DashboardProvider({
  provider,
  companies = DEFAULT_COMPANIES,
  children,
}: {
  provider: MarketDataProvider;
  companies?: Company[];
  children: ReactNode;
}) {
  const [window, setWindow] = useState<TimeWindow>('day');
  const value = useMemo(
    () => ({ provider, companies, window, setWindow }),
    [provider, companies, window],
  );
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard(): DashboardState {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider');
  return ctx;
}
