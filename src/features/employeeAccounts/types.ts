export type EmployeeAccountStatus = 'pending' | 'approved' | 'rejected';

export interface EmployeeAccount {
  id: string;
  name: string;
  email: string;
  department: string;
  employeeId: string;
  accountStatus: EmployeeAccountStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}
