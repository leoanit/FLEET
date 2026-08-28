export type VehicleStatus = 'active' | 'idle' | 'maintenance' | 'offline';

export interface VehicleTelemetry {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  fuelLevel: number;
  odometer: number;
  locationName?: string;
  lastUpdated: string;
}

export interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  status: VehicleStatus;
  type: 'truck' | 'van' | 'car';
  assignedDriver?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  telemetry: VehicleTelemetry;
  createdAt: string;
}

export interface CreateVehicleInput {
  name: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  type: 'truck' | 'van' | 'car';
  status: VehicleStatus;
}

export interface UpdateVehicleInput extends Partial<CreateVehicleInput> {
  id: string;
}
