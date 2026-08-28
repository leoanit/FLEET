import apiClient from '../../services/apiClient';
import { Vehicle, CreateVehicleInput, UpdateVehicleInput } from './types';

export const vehiclesApi = {
  // Fetch vehicles with optional status filtering
  getVehicles: async (status?: string): Promise<Vehicle[]> => {
    const response = await apiClient.get<Vehicle[]>('/vehicles', { params: { status } });
    return response.data;
  },

  // Fetch a single vehicle detail dossier
  getVehicleById: async (id: string): Promise<Vehicle> => {
    const response = await apiClient.get<Vehicle>(`/vehicles/${id}`);
    return response.data;
  },

  // Create a new vehicle asset registry entry
  createVehicle: async (input: CreateVehicleInput): Promise<Vehicle> => {
    const response = await apiClient.post<Vehicle>('/vehicles', input);
    return response.data;
  },

  // Update an existing vehicle's specifications
  updateVehicle: async (input: UpdateVehicleInput): Promise<Vehicle> => {
    const response = await apiClient.put<Vehicle>(`/vehicles/${input.id}`, input);
    return response.data;
  },

  // Decommission a vehicle from the fleet registry
  deleteVehicle: async (id: string): Promise<void> => {
    await apiClient.delete(`/vehicles/${id}`);
  }
};
