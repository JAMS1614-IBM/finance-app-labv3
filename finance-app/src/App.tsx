import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { createProvider } from './services';
import { shouldRetry } from './state/queries';
import { DashboardProvider } from './state/DashboardContext';
import { DashboardPage } from './pages/DashboardPage';

export default function App() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: shouldRetry } } }));
  const [provider] = useState(() => createProvider());
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardProvider provider={provider}>
        <DashboardPage />
      </DashboardProvider>
    </QueryClientProvider>
  );
}
