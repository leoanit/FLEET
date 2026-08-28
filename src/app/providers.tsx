import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Configure TanStack Query Client with enterprise caching strategies
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents aggressive background fetches
      retry: 1,                    // Limit retries on network failures
      staleTime: 1000 * 60 * 5,     // 5 minutes cache validity
      gcTime: 1000 * 60 * 30,       // 30 minutes garbage collection
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};
