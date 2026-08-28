import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driversApi } from '../api';
import { CreateDriverInput, UpdateDriverInput, DriverCreationResponse } from '../types';

export const driverKeys = {
  all: ['drivers'] as const,
  lists: () => [...driverKeys.all, 'list'] as const,
  list: (status?: string) => [...driverKeys.lists(), { status }] as const,
  details: () => [...driverKeys.all, 'detail'] as const,
  detail: (id: string) => [...driverKeys.details(), id] as const,
};

export const useDriversList = (status?: string) => {
  return useQuery({
    queryKey: driverKeys.list(status),
    queryFn: () => driversApi.getDrivers(status),
    refetchInterval: 5000, // Sync status in real-time every 5s
  });
};

export const useDriverDetails = (id: string) => {
  return useQuery({
    queryKey: driverKeys.detail(id),
    queryFn: () => driversApi.getDriverById(id),
    enabled: !!id,
  });
};

export const useDriverActions = () => {
  const queryClient = useQueryClient();

  const createDriverMutation = useMutation<DriverCreationResponse, Error, CreateDriverInput>({
    mutationFn: (input: CreateDriverInput) => driversApi.createDriver(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
    },
  });

  const updateDriverMutation = useMutation({
    mutationFn: (input: UpdateDriverInput) => driversApi.updateDriver(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
      queryClient.setQueryData(driverKeys.detail(data.id), data);
    },
  });

  const deleteDriverMutation = useMutation({
    mutationFn: (id: string) => driversApi.deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (driverId: string) => driversApi.resetPassword(driverId),
  });

  const addNoteMutation = useMutation({
    mutationFn: (params: { driverId: string; author: string; content: string }) => 
      driversApi.addNote(params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
      queryClient.setQueryData(driverKeys.detail(data.id), data);
    }
  });

  return {
    createDriver: createDriverMutation.mutateAsync,
    isCreating: createDriverMutation.isPending,
    updateDriver: updateDriverMutation.mutateAsync,
    isUpdating: updateDriverMutation.isPending,
    deleteDriver: deleteDriverMutation.mutateAsync,
    isDeleting: deleteDriverMutation.isPending,
    addNote: addNoteMutation.mutateAsync,
    isAddingNote: addNoteMutation.isPending,
    resetPassword: resetPasswordMutation.mutateAsync,
    isResettingPassword: resetPasswordMutation.isPending,
  };
};
