import { useDriversList } from '../../drivers/hooks/useDrivers';
import { useVehiclesList } from '../../vehicles/hooks/useVehicles';
import { useDispatches } from './useTrips';

interface UseAssetAvailabilityOptions {
  // When editing an existing dispatch, exclude it from the busy set and treat
  // its already-assigned driver/vehicle as available even if their live
  // status is momentarily "on-trip"/"active" because of this very dispatch.
  excludeDispatchId?: string;
  currentDriverId?: string;
  currentVehicleId?: string;
}

// Classifies drivers/vehicles as available or unavailable for a new dispatch
// assignment, cross-referencing any non-completed dispatch that already
// occupies them. Shared by DispatchFormModal (dispatch create/edit) and
// ApproveRequestModal (transport request approval) so both pickers show
// identical availability.
export function useAssetAvailability(options: UseAssetAvailabilityOptions = {}) {
  const { excludeDispatchId, currentDriverId, currentVehicleId } = options;
  const { data: drivers = [], isLoading: isLoadingDrivers } = useDriversList();
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehiclesList();
  const { data: allDispatches = [] } = useDispatches();

  const busyDriverIds = new Set(
    allDispatches
      .filter((d) => d.id !== excludeDispatchId && ['Pending', 'Assigned', 'In Progress'].includes(d.status))
      .map((d) => d.driverId)
      .filter(Boolean)
  );

  const busyVehicleIds = new Set(
    allDispatches
      .filter((d) => d.id !== excludeDispatchId && ['Pending', 'Assigned', 'In Progress'].includes(d.status))
      .map((d) => d.vehicleId)
      .filter(Boolean)
  );

  const classifiedDrivers = drivers.map((d) => {
    const isCurrentlyAssigned = currentDriverId === d.id;
    const isBusyOnDispatch = busyDriverIds.has(d.id) && !isCurrentlyAssigned;
    const isBusyByStatus = d.status === 'on-trip';
    const isOffline = d.status === 'offline';
    const isAvailable = !isBusyOnDispatch && !isBusyByStatus && !isOffline;

    let unavailableReason = '';
    if (isBusyByStatus) unavailableReason = 'Currently on trip';
    else if (isBusyOnDispatch) unavailableReason = 'Assigned to another dispatch';
    else if (isOffline) unavailableReason = 'Offline / Suspended';

    return { ...d, isAvailable, unavailableReason, isCurrentlyAssigned };
  });

  const classifiedVehicles = vehicles.map((v) => {
    const isCurrentlyAssigned = currentVehicleId === v.id;
    const isBusyOnDispatch = busyVehicleIds.has(v.id) && !isCurrentlyAssigned;
    const isBusyByStatus = v.status === 'active';
    const isInMaintenance = v.status === 'maintenance';
    const isOffline = v.status === 'offline';
    const isAvailable = !isBusyOnDispatch && !isBusyByStatus && !isInMaintenance && !isOffline;

    let unavailableReason = '';
    if (isBusyByStatus) unavailableReason = 'Currently active on route';
    else if (isBusyOnDispatch) unavailableReason = 'Assigned to another dispatch';
    else if (isInMaintenance) unavailableReason = 'Under maintenance';
    else if (isOffline) unavailableReason = 'Offline';

    return { ...v, isAvailable, unavailableReason, isCurrentlyAssigned };
  });

  return {
    drivers: classifiedDrivers,
    vehicles: classifiedVehicles,
    availableDrivers: classifiedDrivers.filter((d) => d.isAvailable),
    unavailableDrivers: classifiedDrivers.filter((d) => !d.isAvailable),
    availableVehicles: classifiedVehicles.filter((v) => v.isAvailable),
    unavailableVehicles: classifiedVehicles.filter((v) => !v.isAvailable),
    isLoadingDrivers,
    isLoadingVehicles,
  };
}
