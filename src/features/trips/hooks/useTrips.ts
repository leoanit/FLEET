import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as tripsApi from '../api';
import { Dispatch } from '../types';
import { useUIStore } from '../../../store/useUIStore';

// Query keys for query client cache management
export const TRIP_KEYS = {
  allDispatches: ['dispatches'] as const,
  dispatchDetails: (id: string) => ['dispatches', id] as const,
  activeTrips: ['trips', 'active'] as const,
  tripDetails: (id: string) => ['trips', id] as const,
  allTrips: ['trips', 'all'] as const,
};

// Hook: Fetch dispatches ledger
export const useDispatches = (status?: string) => {
  return useQuery({
    queryKey: status ? [...TRIP_KEYS.allDispatches, { status }] : TRIP_KEYS.allDispatches,
    queryFn: () => tripsApi.getDispatches(status),
    refetchInterval: 5000, // Sync dispatches ledger in real-time every 5s
  });
};

// Hook: Fetch specific dispatch details by ID
export const useDispatchDetails = (id: string) => {
  return useQuery({
    queryKey: TRIP_KEYS.dispatchDetails(id),
    queryFn: () => tripsApi.getDispatchById(id),
    enabled: !!id,
  });
};

// Hook: Create a new dispatch allocation
export const useCreateDispatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsApi.createDispatch,
    onSuccess: () => {
      // Invalidate dispatch grids and dashboard rosters
      queryClient.invalidateQueries({ queryKey: TRIP_KEYS.allDispatches });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
};

// Hook: Update existing dispatch specs or asset locks
export const useUpdateDispatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Dispatch, 'id' | 'referenceNumber' | 'createdAt'>> }) =>
      tripsApi.updateDispatch(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TRIP_KEYS.allDispatches });
      queryClient.invalidateQueries({ queryKey: TRIP_KEYS.dispatchDetails(data.id) });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
};

// Hook: Remove/delete a pending or cancelled dispatch
export const useDeleteDispatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsApi.deleteDispatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRIP_KEYS.allDispatches });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
};

// Hook: Query all active ongoing trips
export const useActiveTrips = () => {
  return useQuery({
    queryKey: TRIP_KEYS.activeTrips,
    queryFn: tripsApi.getActiveTrips,
    refetchInterval: 5000, // Sync active trips in real-time every 5s
  });
};

// Hook: Query all trips history registry
export const useTripsHistory = () => {
  return useQuery({
    queryKey: TRIP_KEYS.allTrips,
    queryFn: tripsApi.getTrips,
  });
};

// Hook: Query specific trip records details
export const useTripDetails = (id: string) => {
  return useQuery({
    queryKey: TRIP_KEYS.tripDetails(id),
    queryFn: () => tripsApi.getTripDetails(id),
    enabled: !!id,
  });
};

// Hook: Process departure trip transition
export const useStartTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsApi.startTrip,
    onSuccess: (data) => {
      // Invalidate active grids, dispatches, drivers status lists, and vehicles status lists
      queryClient.invalidateQueries({ queryKey: TRIP_KEYS.allDispatches });
      queryClient.invalidateQueries({ queryKey: TRIP_KEYS.activeTrips });
      queryClient.invalidateQueries({ queryKey: TRIP_KEYS.allTrips });
      if (data.dispatch?.id) {
        queryClient.invalidateQueries({ queryKey: TRIP_KEYS.dispatchDetails(data.dispatch.id) });
      }
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });

      // Trigger one-time success notification
      useUIStore.getState().addNotification(
        'success',
        'Cargo Transit Initiated',
        `Dispatch #${data.dispatch?.referenceNumber || 'N/A'} is now active on Mombasa-Nairobi Expressway.`
      );
    },
  });
};

// Hook: Process completion trip transition with driver readings
export const useEndTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { dispatchId: string; endingOdometer: number; fuelUsed: number }) =>
      tripsApi.endTrip(payload),
    onSuccess: (data) => {
      // Invalidate active grids, dispatches, completed records, and release vehicle & driver states
      queryClient.invalidateQueries({ queryKey: TRIP_KEYS.allDispatches });
      queryClient.invalidateQueries({ queryKey: TRIP_KEYS.activeTrips });
      queryClient.invalidateQueries({ queryKey: TRIP_KEYS.allTrips });
      if (data.dispatch?.id) {
        queryClient.invalidateQueries({ queryKey: TRIP_KEYS.dispatchDetails(data.dispatch.id) });
      }
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });

      // Trigger one-time success notification
      useUIStore.getState().addNotification(
        'success',
        'Cargo Delivered Successfully',
        `Dispatch #${data.dispatch?.referenceNumber || 'N/A'} has arrived at destination and closed.`
      );
    },
  });
};
