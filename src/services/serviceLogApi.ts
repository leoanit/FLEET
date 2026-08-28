import apiClient from './apiClient';

export interface ServiceLog {
  id: string;
  vehicleId: string;
  vehicleName: string;
  serviceType: string;
  description: string;
  odometerAtService: number;
  cost: number;
  performedBy: string;
  serviceDate: string;
  nextServiceMileage?: number;
  createdAt: string;
}

export interface CreateServiceLogPayload {
  serviceType: string;
  description?: string;
  odometerAtService: number;
  cost?: number;
  performedBy?: string;
  serviceDate?: string;
  nextServiceMileage?: number;
}

export const getServiceLogs = async (vehicleId: string): Promise<ServiceLog[]> => {
  const response = await apiClient.get<ServiceLog[]>(`/vehicles/${vehicleId}/service-logs`);
  return response.data;
};

export const createServiceLog = async (
  vehicleId: string,
  data: CreateServiceLogPayload
): Promise<ServiceLog> => {
  const response = await apiClient.post<ServiceLog>(`/vehicles/${vehicleId}/service-logs`, data);
  return response.data;
};

export const deleteServiceLog = async (logId: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/service-logs/${logId}`);
  return response.data;
};

export const getAllServiceLogs = async (): Promise<ServiceLog[]> => {
  const response = await apiClient.get<ServiceLog[]>('/service-logs');
  return response.data;
};
