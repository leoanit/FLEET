export type TripStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Dispatch {
  id: string;
  referenceNumber: string;
  origin: string;
  destination: string;
  scheduledDate: string;
  status: TripStatus;
  driverId?: string;
  driverName?: string;
  vehicleId?: string;
  vehicleName?: string;
  plateNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface TripCheckpoint {
  locationName: string;
  timestamp: string;
  odometer?: number;
  fuelLevel?: number;
}

export interface Trip {
  id: string;
  dispatchId: string;
  startTime: string;
  endTime?: string;
  status: 'In Progress' | 'Completed';
  distance: number;
  fuelUsed: number;
  startOdometer: number;
  endOdometer: number;
  duration: number;
  createdAt: string;
  dispatch?: Dispatch; // Joined parent dispatch details
  checkpoints?: TripCheckpoint[];
}
