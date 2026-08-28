import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi } from '../api';
import { CreateVehicleInput, UpdateVehicleInput } from '../types';

// Structured Cache Key Factory
export const vehicleKeys = {
  all: ['vehicles'] as const,
  lists: () => [...vehicleKeys.all, 'list'] as const,
  list: (status?: string) => [...vehicleKeys.lists(), { status }] as const,
  details: () => [...vehicleKeys.all, 'detail'] as const,
  detail: (id: string) => [...vehicleKeys.details(), id] as const,
};

// Hook for fetching a list of vehicles
export const useVehiclesList = (status?: string) => {
  return useQuery({
    queryKey: vehicleKeys.list(status),
    queryFn: () => vehiclesApi.getVehicles(status),
    refetchInterval: 5000, // Sync status and telemetry in real-time every 5s
  });
};

// Hook for fetching a single vehicle by ID
export const useVehicleDetails = (id: string) => {
  return useQuery({
    queryKey: vehicleKeys.detail(id),
    queryFn: () => vehiclesApi.getVehicleById(id),
    enabled: !!id, // Only trigger if ID is active
  });
};

// Actions and mutations hook
export const useVehicleActions = () => {
  const queryClient = useQueryClient();

  // Create Vehicle Mutation
  const createVehicleMutation = useMutation({
    mutationFn: (input: CreateVehicleInput) => vehiclesApi.createVehicle(input),
    onSuccess: () => {
      // Invalidate vehicle queries to trigger fresh sync
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
    },
  });

  // Update Vehicle Mutation
  const updateVehicleMutation = useMutation({
    mutationFn: (input: UpdateVehicleInput) => vehiclesApi.updateVehicle(input),
    onSuccess: (data) => {
      // Refresh list layouts
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
      // Update details cache directly for target vehicle
      queryClient.setQueryData(vehicleKeys.detail(data.id), data);
    },
  });

  // Delete Vehicle Mutation
  const deleteVehicleMutation = useMutation({
    mutationFn: (id: string) => vehiclesApi.deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
    },
  });

  return {
    createVehicle: createVehicleMutation.mutateAsync,
    isCreating: createVehicleMutation.isPending,
    updateVehicle: updateVehicleMutation.mutateAsync,
    isUpdating: updateVehicleMutation.isPending,
    deleteVehicle: deleteVehicleMutation.mutateAsync,
    isDeleting: deleteVehicleMutation.isPending,
  };
};
