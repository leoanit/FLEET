import apiClient from '../../services/apiClient';
import { Driver, CreateDriverInput, UpdateDriverInput, DriverCreationResponse, DriverCredentials } from './types';

export const driversApi = {
  // Fetch drivers registry
  getDrivers: async (status?: string): Promise<Driver[]> => {
    const response = await apiClient.get<Driver[]>('/drivers', { params: { status } });
    return response.data;
  },

  // Fetch driver profile dossier by ID
  getDriverById: async (id: string): Promise<Driver> => {
    const response = await apiClient.get<Driver>(`/drivers/${id}`);
    return response.data;
  },

  // Enroll driver into active registry
  createDriver: async (input: CreateDriverInput): Promise<DriverCreationResponse> => {
    const response = await apiClient.post<DriverCreationResponse>('/drivers', input);
    return response.data;
  },

  // Update driver dossier metadata details
  updateDriver: async (input: UpdateDriverInput): Promise<Driver> => {
    const response = await apiClient.put<Driver>(`/drivers/${input.id}`, input);
    return response.data;
  },

  // Decommission driver from active service
  deleteDriver: async (id: string): Promise<void> => {
    await apiClient.delete(`/drivers/${id}`);
  },

  // Reset operator login password — admin only
  resetPassword: async (driverId: string): Promise<DriverCredentials> => {
    const response = await apiClient.post<DriverCredentials>(`/drivers/${driverId}/reset-password`);
    return response.data;
  },

  // Save dispatcher administrative note to Operator Journal
  addNote: async (params: { driverId: string; author: string; content: string }): Promise<Driver> => {
    const response = await apiClient.post<Driver>(`/drivers/${params.driverId}/notes`, {
      author: params.author,
      content: params.content,
    });
    return response.data;
  }
};
