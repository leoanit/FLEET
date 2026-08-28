import apiClient from '../../services/apiClient';
import { EmployeeAccount } from './types';

export const getEmployeeAccounts = async (status?: string): Promise<EmployeeAccount[]> => {
  const response = await apiClient.get<EmployeeAccount[]>('/employee-accounts', {
    params: { status },
  });
  return response.data;
};

export const approveEmployeeAccount = async (id: string): Promise<EmployeeAccount> => {
  const response = await apiClient.post<EmployeeAccount>(`/employee-accounts/${id}/approve`);
  return response.data;
};

export const rejectEmployeeAccount = async (id: string, reason: string): Promise<EmployeeAccount> => {
  const response = await apiClient.post<EmployeeAccount>(`/employee-accounts/${id}/reject`, { reason });
  return response.data;
};
