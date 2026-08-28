import apiClient from '../../services/apiClient';
import { Dispatch, Trip } from './types';

// Fetch all dispatches (supports optional status query filtering)
export const getDispatches = async (status?: string): Promise<Dispatch[]> => {
  const response = await apiClient.get<Dispatch[]>('/dispatches', {
    params: { status }
  });
  return response.data;
};

// Fetch specific dispatch details by ID
export const getDispatchById = async (id: string): Promise<Dispatch> => {
  const response = await apiClient.get<Dispatch>(`/dispatches/${id}`);
  return response.data;
};

// Create a new logistics dispatch
export const createDispatch = async (data: {
  origin: string;
  destination: string;
  scheduledDate: string;
  notes?: string;
  driverId?: string;
  vehicleId?: string;
}): Promise<Dispatch> => {
  const response = await apiClient.post<Dispatch>('/dispatches', data);
  return response.data;
};

// Update existing dispatch allocations or details
export const updateDispatch = async (
  id: string,
  data: Partial<Omit<Dispatch, 'id' | 'referenceNumber' | 'createdAt'>>
): Promise<Dispatch> => {
  const response = await apiClient.put<Dispatch>(`/dispatches/${id}`, data);
  return response.data;
};

// Delete a pending or cancelled dispatch
export const deleteDispatch = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/dispatches/${id}`);
  return response.data;
};

// Fetch all active, ongoing trips (Status: In Progress)
export const getActiveTrips = async (): Promise<Trip[]> => {
  const response = await apiClient.get<Trip[]>('/trips/active');
  return response.data;
};

// Fetch specific trip analytics by ID
export const getTripDetails = async (id: string): Promise<Trip> => {
  const response = await apiClient.get<Trip>(`/trips/${id}`);
  return response.data;
};

// Initiate departure for an assigned dispatch (Starts Trip)
export const startTrip = async (dispatchId: string): Promise<Trip> => {
  const response = await apiClient.post<Trip>('/trips/start', { dispatchId });
  return response.data;
};

// Process completion for an ongoing trip (Ends Trip) with driver-submitted readings
export const endTrip = async (payload: {
  dispatchId: string;
  endingOdometer: number;
  fuelUsed: number;
}): Promise<Trip> => {
  const response = await apiClient.post<Trip>('/trips/end', payload);
  return response.data;
};

export const getTrips = async (): Promise<Trip[]> => {
  const response = await apiClient.get<Trip[]>('/trips');
  return response.data;
};
