import { Dispatch } from '../models/Dispatch';
import { Driver } from '../models/Driver';
import { Vehicle } from '../models/Vehicle';

export class DispatchAssignmentError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface AssignDispatchParams {
  origin: string;
  destination: string;
  scheduledDate: Date;
  notes?: string;
  driverId?: string;
  vehicleId?: string;
}

// Creates a Dispatch, validating driver/vehicle availability and syncing their
// status. Shared by direct dispatch creation (dispatches.ts) and transport
// request approval (transportRequests.ts) so the availability rules live in
// exactly one place.
export async function assignDispatch(params: AssignDispatchParams) {
  const { origin, destination, scheduledDate, notes, driverId, vehicleId } = params;

  let resolvedDriverName: string | undefined;
  let resolvedVehicleName: string | undefined;
  let resolvedPlateNumber: string | undefined;
  let initialStatus = 'Pending';

  // 1. Verify Driver availability if provided
  if (driverId) {
    const driver = await Driver.findById(driverId);
    if (!driver) {
      throw new DispatchAssignmentError(404, 'Assigned driver profile not found');
    }

    if (driver.status === 'on-trip') {
      throw new DispatchAssignmentError(400, 'Assigned driver is currently active on another trip');
    }

    const activeBookings = await Dispatch.findOne({
      driverId,
      status: { $in: ['Assigned', 'In Progress'] },
    });
    if (activeBookings) {
      throw new DispatchAssignmentError(400, 'Assigned driver is already allocated to another active/assigned dispatch');
    }

    resolvedDriverName = driver.name;
  }

  // 2. Verify Vehicle availability if provided
  if (vehicleId) {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      throw new DispatchAssignmentError(404, 'Assigned vehicle record not found');
    }

    if (vehicle.status === 'active' || vehicle.status === 'maintenance') {
      throw new DispatchAssignmentError(400, `Assigned vehicle is currently unavailable (Status: ${vehicle.status})`);
    }

    const activeBookings = await Dispatch.findOne({
      vehicleId,
      status: { $in: ['Assigned', 'In Progress'] },
    });
    if (activeBookings) {
      throw new DispatchAssignmentError(400, 'Assigned vehicle is already allocated to another active/assigned dispatch');
    }

    resolvedVehicleName = vehicle.name;
    resolvedPlateNumber = vehicle.plateNumber;
  }

  // Promote status to Assigned if both Driver and Vehicle are present
  if (driverId && vehicleId) {
    initialStatus = 'Assigned';
  }

  const dispatch = new Dispatch({
    origin,
    destination,
    scheduledDate,
    notes: notes || '',
    status: initialStatus,
    driverId,
    driverName: resolvedDriverName,
    vehicleId,
    vehicleName: resolvedVehicleName,
    plateNumber: resolvedPlateNumber,
  });

  await dispatch.save();

  // Seamless status updates upon creation
  if (driverId) {
    await Driver.findByIdAndUpdate(driverId, { status: 'active' });
  }
  if (vehicleId) {
    await Vehicle.findByIdAndUpdate(vehicleId, { status: 'idle' });
  }

  return dispatch;
}
