import apiClient from './apiClient';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'dispatcher' | 'operator' | 'employee';
  };
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  return response.data;
};

export const requestAccess = async (
  name: string,
  email: string,
  department: string,
  employeeId: string
): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/auth/request-access', {
    name,
    email,
    department,
    employeeId,
  });
  return response.data;
};
