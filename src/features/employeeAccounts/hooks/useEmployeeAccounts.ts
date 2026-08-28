import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as employeeAccountsApi from '../api';

export const EMPLOYEE_ACCOUNT_KEYS = {
  all: ['employeeAccounts'] as const,
};

export const useEmployeeAccounts = (status?: string) => {
  return useQuery({
    queryKey: status ? [...EMPLOYEE_ACCOUNT_KEYS.all, { status }] : EMPLOYEE_ACCOUNT_KEYS.all,
    queryFn: () => employeeAccountsApi.getEmployeeAccounts(status),
    refetchInterval: 5000,
  });
};

export const useApproveEmployeeAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeAccountsApi.approveEmployeeAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_ACCOUNT_KEYS.all });
    },
  });
};

export const useRejectEmployeeAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => employeeAccountsApi.rejectEmployeeAccount(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_ACCOUNT_KEYS.all });
    },
  });
};
