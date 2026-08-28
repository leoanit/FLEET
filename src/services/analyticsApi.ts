import apiClient from './apiClient';

export interface WeeklyTripStat {
  name: string;
  tripCount: number;
  totalDistance: number;
  totalFuelUsed: number;
}

export interface MaintenanceAlert {
  vehicleId: string;
  vehicleName: string;
  plateNumber: string;
  currentOdometer: number;
  nextServiceMileage: number;
  serviceType: string;
  remainingKm: number;
  status: string;
}

export interface AnalyticsSummary {
  vehicles: {
    total: number;
    active: number;
    idle: number;
    maintenance: number;
    offline: number;
    healthScore: number;
  };
  drivers: {
    total: number;
    onTrip: number;
    active: number;
    idle: number;
  };
  activeTripCount: number;
  complianceAlerts: number;
  maintenanceAlerts: MaintenanceAlert[];
  weeklyTrips: WeeklyTripStat[];
  generatedAt: string;
}

export const getAnalyticsSummary = async (): Promise<AnalyticsSummary> => {
  const response = await apiClient.get<AnalyticsSummary>('/analytics/summary');
  return response.data;
};
