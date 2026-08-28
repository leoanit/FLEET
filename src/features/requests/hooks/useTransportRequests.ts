import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as requestsApi from '../api';

export const TRANSPORT_REQUEST_KEYS = {
  all: ['transportRequests'] as const,
};

export const useTransportRequests = (status?: string) => {
  return useQuery({
    queryKey: status ? [...TRANSPORT_REQUEST_KEYS.all, { status }] : TRANSPORT_REQUEST_KEYS.all,
    queryFn: () => requestsApi.getTransportRequests(status),
    refetchInterval: 5000,
  });
};

export const useCreateTransportRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestsApi.createTransportRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSPORT_REQUEST_KEYS.all });
    },
  });
};

export const useApproveTransportRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, driverId, vehicleId, notes }: { id: string; driverId: string; vehicleId: string; notes?: string }) =>
      requestsApi.approveTransportRequest(id, { driverId, vehicleId, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSPORT_REQUEST_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['dispatches'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
};

export const useRejectTransportRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => requestsApi.rejectTransportRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSPORT_REQUEST_KEYS.all });
    },
  });
};
