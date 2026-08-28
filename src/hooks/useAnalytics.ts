import { useQuery } from '@tanstack/react-query';
import { getAnalyticsSummary } from '../services/analyticsApi';

export const ANALYTICS_KEYS = {
  summary: ['analytics', 'summary'] as const,
};

export const useAnalyticsSummary = () => {
  return useQuery({
    queryKey: ANALYTICS_KEYS.summary,
    queryFn: getAnalyticsSummary,
    refetchInterval: 30000, // Background refetch every 30 seconds for live dashboard feel
    staleTime: 15000,
  });
};
