import { Router, Request, Response } from 'express';
import { Vehicle } from '../models/Vehicle';
import { Driver } from '../models/Driver';
import { Trip } from '../models/Trip';
import { Dispatch } from '../models/Dispatch';
import { broadcast } from '../websocket';
import { collectErrors, requireFields, requireEnum, requireRange } from '../utils/validate';
import { verifyToken, requireAdmin, requireRole } from '../middleware/auth';

const VEHICLE_TYPES = ['truck', 'van', 'car'] as const;
const VEHICLE_STATUSES = ['active', 'idle', 'maintenance', 'offline'] as const;

const router = Router();

// HTTP GET: Fetch Vehicle Fleet manifest (options for status query filters)
// All authenticated roles — operators need to see vehicles from the driver portal.
router.get('/', verifyToken, async (req: Request, res: Response) => {
  const { status } = req.query;
  const filter: any = {};
  
  if (status) {
    filter.status = status;
  }

  try {
    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
    return res.json(vehicles);
  } catch (error: any) {
    console.error('Fetch vehicles failed:', error);
    return res.status(500).json({ message: 'Failed to query fleet database registers' });
  }
});

// HTTP GET: Fetch Vehicle Asset detail logs by id
router.get('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Fleet asset record not located' });
    }
    return res.json(vehicle);
  } catch (error: any) {
    console.error(`Fetch vehicle ${req.params.id} failed:`, error);
    return res.status(500).json({ message: 'Failed to access vehicle logs' });
  }
});

// HTTP POST: Enroll Certified Fleet Asset — admin only (asset roster management)
router.post('/', verifyToken, requireRole('admin'), async (req: Request, res: Response) => {
  const { name, plateNumber, make, model, year, type, status } = req.body;

  const currentYear = new Date().getFullYear();
  const errors = collectErrors(
    requireFields(req.body, ['name', 'plateNumber', 'make', 'model', 'year', 'type']),
    requireEnum('type', type, VEHICLE_TYPES),
    requireEnum('status', status, VEHICLE_STATUSES),
    requireRange('year', year, 1990, currentYear + 1),
  );
  if (errors.length > 0) {
    return res.status(400).json({ message: errors[0].message, errors });
  }

  try {
    // 1. Check plate uniqueness
    const exists = await Vehicle.findOne({ plateNumber: plateNumber.toUpperCase() });
    if (exists) {
      return res.status(400).json({ message: 'A vehicle with this license plate is already enrolled' });
    }

    // 2. Instantiate and save Mongoose model
    const vehicle = new Vehicle({
      name,
      plateNumber,
      make,
      model,
      year,
      type,
      status: status || 'idle',
      // Seed default baseline telemetry for Seattle mapping
      telemetry: {
        latitude: 47.6062,
        longitude: -122.3321,
        speed: 0,
        heading: 0,
        odometer: 0,
        fuelLevel: 100,
        updatedAt: new Date()
      }
    });

    await vehicle.save();
    return res.status(201).json(vehicle);
  } catch (error: any) {
    console.error('Create vehicle failed:', error);
    return res.status(500).json({ message: 'Database transaction error enrolling vehicle' });
  }
});

// HTTP PUT: Modify Asset Specifications — admin + dispatcher (dispatchers assign vehicles)
router.put('/:id', verifyToken, requireAdmin, async (req: Request, res: Response) => {
  const { name, plateNumber, make, model, year, type, status, assignedDriverId } = req.body;

  const currentYear = new Date().getFullYear();
  const updateErrors = collectErrors(
    requireEnum('type', type, VEHICLE_TYPES),
    requireEnum('status', status, VEHICLE_STATUSES),
    requireRange('year', year, 1990, currentYear + 1),
  );
  if (updateErrors.length > 0) {
    return res.status(400).json({ message: updateErrors[0].message, errors: updateErrors });
  }

  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle asset record not found' });
    }

    // 1. Handle dynamic driver assignment sync updates
    let assignedDriverName = vehicle.assignedDriverName;
    if (assignedDriverId !== undefined && assignedDriverId !== vehicle.assignedDriverId) {
      if (assignedDriverId) {
        const newDriver = await Driver.findById(assignedDriverId);
        if (!newDriver) {
          return res.status(404).json({ message: 'Certified operator profile not located for assignment' });
        }
        assignedDriverName = newDriver.name;

        // Clear any old driver's vehicle reference
        if (vehicle.assignedDriverId) {
          await Driver.findByIdAndUpdate(vehicle.assignedDriverId, {
            assignedVehicleId: undefined,
            assignedVehicleName: undefined,
          });
        }

        // Set the new driver's vehicle reference
        await Driver.findByIdAndUpdate(assignedDriverId, {
          assignedVehicleId: vehicle.id,
          assignedVehicleName: name || vehicle.name,
        });
      } else {
        // Clearing driver assignment
        assignedDriverName = undefined;
        if (vehicle.assignedDriverId) {
          await Driver.findByIdAndUpdate(vehicle.assignedDriverId, {
            assignedVehicleId: undefined,
            assignedVehicleName: undefined,
          });
        }
      }
    }

    // 2. Perform vehicle document updates
    vehicle.name = name || vehicle.name;
    vehicle.plateNumber = plateNumber || vehicle.plateNumber;
    vehicle.make = make || vehicle.make;
    vehicle.model = model || vehicle.model;
    vehicle.year = year || vehicle.year;
    vehicle.type = type || vehicle.type;
    vehicle.status = status || vehicle.status;
    vehicle.assignedDriverId = assignedDriverId !== undefined ? assignedDriverId : vehicle.assignedDriverId;
    vehicle.assignedDriverName = assignedDriverName;

    await vehicle.save();
    return res.json(vehicle);
  } catch (error: any) {
    console.error(`Update vehicle ${req.params.id} failed:`, error);
    return res.status(500).json({ message: 'Failed to synchronize vehicle update' });
  }
});

// HTTP DELETE: Decommission Fleet Asset — admin only (irreversible, affects trips/assignments)
router.delete('/:id', verifyToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle asset not found in database registry' });
    }

    // 1. Sever and clear assignments on active operator records
    if (vehicle.assignedDriverId) {
      await Driver.findByIdAndUpdate(vehicle.assignedDriverId, {
        assignedVehicleId: undefined,
        assignedVehicleName: undefined,
      });
    }

    // 2. Delete the vehicle asset
    await Vehicle.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Fleet asset successfully decommissioned from service' });
  } catch (error: any) {
    console.error(`Decommission vehicle ${req.params.id} failed:`, error);
    return res.status(500).json({ message: 'Failed to decommission vehicle from databases' });
  }
});

// HTTP POST: Update Vehicle Telemetry — all authenticated (operators update their own vehicle)
router.post('/:id/telemetry', verifyToken, async (req: Request, res: Response) => {
  const { odometer, fuelLevel, locationName, latitude, longitude } = req.body;

  const telemetryErrors = collectErrors(
    requireRange('odometer', odometer, 0, 9_999_999),
    requireRange('fuelLevel', fuelLevel, 0, 100),
    requireRange('latitude', latitude, -90, 90),
    requireRange('longitude', longitude, -180, 180),
  );
  if (telemetryErrors.length > 0) {
    return res.status(400).json({ message: telemetryErrors[0].message, errors: telemetryErrors });
  }

  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle asset not found' });
    }

    if (!vehicle.telemetry) {
      vehicle.telemetry = {
        latitude: -1.2921,
        longitude: 36.8219,
        speed: 0,
        heading: 0,
        odometer: 0,
        fuelLevel: 100,
        locationName: 'Nairobi',
        updatedAt: new Date()
      };
    }

    // 1. Update Odometer (if higher)
    if (odometer !== undefined) {
      const odoNum = Number(odometer);
      if (odoNum > vehicle.telemetry.odometer) {
        vehicle.telemetry.odometer = odoNum;
      }
    }

    // 2. Update Fuel Level
    if (fuelLevel !== undefined) {
      const fuelNum = Number(fuelLevel);
      if (fuelNum >= 0 && fuelNum <= 100) {
        vehicle.telemetry.fuelLevel = fuelNum;
      }
    }

    // 3. Update Coordinates based on Location Name or direct values
    if (latitude !== undefined && longitude !== undefined) {
      vehicle.telemetry.latitude = Number(latitude);
      vehicle.telemetry.longitude = Number(longitude);
      
      // Reverse geofence to find the closest city name if coordinates are directly supplied
      const kenyanCitiesList = [
        { name: 'Nairobi', lat: -1.2921, lng: 36.8219 },
        { name: 'Mombasa', lat: -4.0435, lng: 39.6682 },
        { name: 'Nakuru', lat: -0.3030, lng: 36.0800 },
        { name: 'Kisumu', lat: -0.1022, lng: 34.7617 },
        { name: 'Eldoret', lat: 0.5143, lng: 35.2698 },
        { name: 'Thika', lat: -1.0396, lng: 37.0900 },
      ];
      let closest = kenyanCitiesList[0];
      let minD = Infinity;
      for (const city of kenyanCitiesList) {
        const d = Math.pow(Number(latitude) - city.lat, 2) + Math.pow(Number(longitude) - city.lng, 2);
        if (d < minD) {
          minD = d;
          closest = city;
        }
      }
      vehicle.telemetry.locationName = closest.name;
    } else if (locationName) {
      const trimmedLocation = locationName.trim();
      vehicle.telemetry.locationName = trimmedLocation
        .split(/\s+/)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      // Helper mapping for Kenyan cities
      const kenyanCities: Record<string, { lat: number; lng: number }> = {
        'nairobi': { lat: -1.2921, lng: 36.8219 },
        'mombasa': { lat: -4.0435, lng: 39.6682 },
        'nakuru': { lat: -0.3030, lng: 36.0800 },
        'kisumu': { lat: -0.1022, lng: 34.7617 },
        'eldoret': { lat: 0.5143, lng: 35.2698 },
        'thika': { lat: -1.0396, lng: 37.0900 },
      };

      const cityCoords = kenyanCities[trimmedLocation.toLowerCase()];
      if (cityCoords) {
        vehicle.telemetry.latitude = cityCoords.lat;
        vehicle.telemetry.longitude = cityCoords.lng;
      }
    }

    vehicle.telemetry.updatedAt = new Date();
    await vehicle.save();

    // Broadcast live telemetry coordinates
    broadcast('GPS_UPDATE', {
      vehicleId: vehicle.id,
      latitude: vehicle.telemetry.latitude,
      longitude: vehicle.telemetry.longitude,
      speed: vehicle.telemetry.speed || 0,
      heading: vehicle.telemetry.heading || 0,
      fuelLevel: vehicle.telemetry.fuelLevel,
      status: vehicle.status,
      locationName: vehicle.telemetry.locationName,
      timestamp: vehicle.telemetry.updatedAt.toISOString(),
    });

    // 4. Record Checkpoint in Active Trip (if exists)
    if (locationName) {
      try {
        const activeDispatch = await Dispatch.findOne({
          vehicleId: vehicle._id.toString(),
          status: 'In Progress',
        });
        if (activeDispatch) {
          const activeTrip = await Trip.findOne({
            dispatchId: activeDispatch._id.toString(),
            status: 'In Progress',
          });
          if (activeTrip) {
            // Ensure checkpoints array exists
            activeTrip.checkpoints = (activeTrip as any).checkpoints || [];
            (activeTrip as any).checkpoints.push({
              locationName: vehicle.telemetry.locationName,
              timestamp: new Date(),
              odometer: odometer ? Number(odometer) : vehicle.telemetry.odometer,
              fuelLevel: fuelLevel !== undefined ? Number(fuelLevel) : vehicle.telemetry.fuelLevel,
            });
            await activeTrip.save();
            console.log(`📍 Logged checkpoint "${vehicle.telemetry.locationName}" for active Trip [${activeTrip._id}]`);
            
            // Broadcast live checkpoint log
            broadcast('CHECKPOINT_LOGGED', {
              vehicleId: vehicle.id,
              vehicleName: vehicle.name,
              plateNumber: vehicle.plateNumber,
              driverName: activeDispatch.driverName || 'Operator',
              locationName: vehicle.telemetry.locationName,
              odometer: odometer ? Number(odometer) : vehicle.telemetry.odometer,
              fuelLevel: fuelLevel !== undefined ? Number(fuelLevel) : vehicle.telemetry.fuelLevel,
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (checkpointErr) {
        console.error('Failed to log active trip checkpoint:', checkpointErr);
      }
    }

    return res.json({
      message: 'Vehicle telemetry successfully updated',
      telemetry: vehicle.telemetry
    });
  } catch (error: any) {
    console.error(`Update telemetry for vehicle ${req.params.id} failed:`, error);
    return res.status(500).json({ message: 'Failed to update vehicle telemetry parameters' });
  }
});

export default router;
