import apiClient from '../../services/apiClient';
import { TransportRequest } from './types';

export const getTransportRequests = async (status?: string): Promise<TransportRequest[]> => {
  const response = await apiClient.get<TransportRequest[]>('/transport-requests', {
    params: { status },
  });
  return response.data;
};

export const getTransportRequestById = async (id: string): Promise<TransportRequest> => {
  const response = await apiClient.get<TransportRequest>(`/transport-requests/${id}`);
  return response.data;
};

export const createTransportRequest = async (data: {
  origin: string;
  destination: string;
  purpose: string;
  travelDateTime: string;
}): Promise<TransportRequest> => {
  const response = await apiClient.post<TransportRequest>('/transport-requests', data);
  return response.data;
};

export const approveTransportRequest = async (
  id: string,
  data: { driverId: string; vehicleId: string; notes?: string }
): Promise<{ transportRequest: TransportRequest; dispatch: any }> => {
  const response = await apiClient.post(`/transport-requests/${id}/approve`, data);
  return response.data;
};

export const rejectTransportRequest = async (id: string, reason: string): Promise<TransportRequest> => {
  const response = await apiClient.post<TransportRequest>(`/transport-requests/${id}/reject`, { reason });
  return response.data;
};
