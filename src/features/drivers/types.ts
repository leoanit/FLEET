export type DriverStatus = 'active' | 'idle' | 'on-trip' | 'offline';
export type LicenseStatus = 'compliant' | 'expiring-soon' | 'expired';

export interface DriverCompliance {
  licenseClass: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseStatus: LicenseStatus;
}

export interface DriverPerformance {
  safetyScore: number; // 0-100
  fuelEfficiencyScore: number; // 0-100
  onTimeDeliveryRate: number; // percentage
  weeklyHoursLogged: number;
}

export interface DriverNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: DriverStatus;
  assignedVehicleId?: string;
  assignedVehicleName?: string;
  tripsCompleted: number;
  rating: number; // 1-5
  compliance: DriverCompliance;
  performance: DriverPerformance;
  notes: DriverNote[];
  createdAt: string;
}

export interface CreateDriverInput {
  name: string;
  email: string;
  phone: string;
  status: DriverStatus;
  licenseClass: string;
  licenseNumber: string;
  licenseExpiry: string;
  assignedVehicleId?: string;
}

export interface UpdateDriverInput extends Partial<CreateDriverInput> {
  id: string;
}

export interface DriverCredentials {
  email: string;
  temporaryPassword: string;
  note: string;
}

export interface DriverCreationResponse extends Driver {
  _credentials?: DriverCredentials;
}
