import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServiceLogs, createServiceLog, deleteServiceLog, CreateServiceLogPayload, getAllServiceLogs } from '../services/serviceLogApi';
import { useUIStore } from '../store/useUIStore';

export const SERVICE_LOG_KEYS = {
  all: ['serviceLogs', 'all'] as const,
  byVehicle: (vehicleId: string) => ['serviceLogs', vehicleId] as const,
};

export const useServiceLogs = (vehicleId: string) => {
  return useQuery({
    queryKey: SERVICE_LOG_KEYS.byVehicle(vehicleId),
    queryFn: () => getServiceLogs(vehicleId),
    enabled: !!vehicleId,
  });
};

export const useAllServiceLogs = () => {
  return useQuery({
    queryKey: SERVICE_LOG_KEYS.all,
    queryFn: getAllServiceLogs,
  });
};

export const useCreateServiceLog = (vehicleId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServiceLogPayload) => createServiceLog(vehicleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICE_LOG_KEYS.byVehicle(vehicleId) });
      queryClient.invalidateQueries({ queryKey: SERVICE_LOG_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'summary'] });

      // Trigger one-time success notification
      useUIStore.getState().addNotification(
        'success',
        'Preventative Service Recorded',
        'A maintenance event has been logged and mechanical thresholds adjusted.'
      );
    },
  });
};

export const useDeleteServiceLog = (vehicleId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteServiceLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICE_LOG_KEYS.byVehicle(vehicleId) });
      queryClient.invalidateQueries({ queryKey: SERVICE_LOG_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'summary'] });
    },
  });
};
