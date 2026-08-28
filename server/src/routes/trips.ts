import { Router, Request, Response } from 'express';
import { Trip } from '../models/Trip';
import { Dispatch } from '../models/Dispatch';
import { Driver } from '../models/Driver';
import { Vehicle } from '../models/Vehicle';
import { User } from '../models/User';
import { verifyToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// HTTP GET: Fetch all trips history — admin + dispatcher (reports ledger, not for operators)
router.get('/', verifyToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const trips = await Trip.find({}).sort({ startTime: -1 }).limit(200);
    const enrichedTrips = await Promise.all(
      trips.map(async (trip) => {
        const dispatch = await Dispatch.findById(trip.dispatchId);
        return {
          ...trip.toJSON(),
          dispatch: dispatch || null,
        };
      })
    );
    return res.json(enrichedTrips);
  } catch (error: any) {
    console.error('Fetch all trips failed:', error);
    return res.status(500).json({ message: 'Failed to access trips database ledger' });
  }
});

// HTTP GET: Fetch active ongoing trips — all authenticated (operators use this for real-time tracking)
router.get('/active', verifyToken, async (req: Request, res: Response) => {
  try {
    const activeTrips = await Trip.find({ status: 'In Progress' }).sort({ startTime: -1 });
    
    // Enrich each trip document with its parent dispatch details for easy UI mapping
    const enrichedTrips = await Promise.all(
      activeTrips.map(async (trip) => {
        const dispatch = await Dispatch.findById(trip.dispatchId);
        return {
          ...trip.toJSON(),
          dispatch: dispatch || null,
        };
      })
    );
    
    return res.json(enrichedTrips);
  } catch (error: any) {
    console.error('Fetch active trips failed:', error);
    return res.status(500).json({ message: 'Failed to access active trips database feed' });
  }
});

// HTTP GET: Fetch specific Trip lifecycle logs by ID — all authenticated
router.get('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    let trip = null;
    
    // Attempt standard lookup by primary Trip ObjectId
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      trip = await Trip.findById(req.params.id);
    }
    
    // Fallback: Attempt lookup by unique dispatchId string
    if (!trip) {
      trip = await Trip.findOne({ dispatchId: req.params.id });
    }
    
    if (!trip) {
      return res.status(404).json({ message: 'Trip log entry not found' });
    }
    
    const dispatch = await Dispatch.findById(trip.dispatchId);
    return res.json({
      ...trip.toJSON(),
      dispatch: dispatch || null,
    });
  } catch (error: any) {
    console.error(`Fetch trip ${req.params.id} failed:`, error);
    return res.status(500).json({ message: 'Failed to query trip operational records' });
  }
});

// HTTP POST: Start a dispatch trip (Transition to In Progress)
router.post('/start', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  const { dispatchId } = req.body;

  if (!dispatchId) {
    return res.status(400).json({ message: 'A valid dispatch ID is required to initiate departure' });
  }

  try {
    // 1. Verify dispatch eligibility
    const dispatch = await Dispatch.findById(dispatchId);
    if (!dispatch) {
      return res.status(404).json({ message: 'Dispatch record not located' });
    }

    // Ensure the driver can only start their own assigned dispatch
    if (req.user?.role === 'operator') {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User profile not found' });
      }
      const driver = await Driver.findOne({ email: user.email });
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }
      if (dispatch.driverId !== driver.id && dispatch.driverId !== driver._id.toString()) {
        return res.status(403).json({ message: 'Access denied: You are not authorized to start this trip as it is not assigned to you' });
      }
    }

    if (dispatch.status === 'In Progress') {
      return res.status(400).json({ message: 'This dispatch trip is already in progress' });
    }

    if (dispatch.status === 'Completed' || dispatch.status === 'Cancelled') {
      return res.status(400).json({ message: `Cannot start a closed dispatch (Status: ${dispatch.status})` });
    }

    if (!dispatch.driverId || !dispatch.vehicleId) {
      return res.status(400).json({ message: 'Both a certified driver and a vehicle asset must be allocated before starting the trip' });
    }

    // Double check that the driver is not already on another active trip
    const driver = await Driver.findById(dispatch.driverId);
    if (driver && driver.status === 'on-trip') {
      return res.status(400).json({ message: 'The allocated driver is currently busy on an active trip' });
    }

    // Double check that the vehicle is not already active
    const vehicle = await Vehicle.findById(dispatch.vehicleId);
    if (vehicle && vehicle.status === 'active') {
      return res.status(400).json({ message: 'The allocated vehicle is currently active on another trip' });
    }

    // 2. Perform transactional updates across collections
    dispatch.status = 'In Progress';
    await dispatch.save();

    // Instantiate active Trip log
    const trip = new Trip({
      dispatchId: dispatch.id,
      startTime: new Date(),
      status: 'In Progress',
      startOdometer: vehicle ? (vehicle.telemetry?.odometer || 0) : 0,
    });
    await trip.save();

    // Lock driver status to on-trip
    if (dispatch.driverId) {
      await Driver.findByIdAndUpdate(dispatch.driverId, { status: 'on-trip' });
    }

    // Lock vehicle status to active
    if (dispatch.vehicleId) {
      await Vehicle.findByIdAndUpdate(dispatch.vehicleId, { status: 'active' });
    }

    console.log(`⚡ Dispatch [${dispatch.referenceNumber}] departed. Driver and Vehicle status locked.`);

    return res.status(201).json({
      ...trip.toJSON(),
      dispatch,
    });
  } catch (error: any) {
    console.error('Start trip transaction failed:', error);
    return res.status(500).json({ message: 'Failed to process departure trip transaction' });
  }
});

// HTTP POST: End a dispatch trip (Transition to Completed)
router.post('/end', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  const { dispatchId, endingOdometer, fuelUsed } = req.body;

  if (!dispatchId) {
    return res.status(400).json({ message: 'A valid dispatch ID is required to process trip completion' });
  }

  // Validate driver-submitted readings
  if (endingOdometer === undefined || endingOdometer === null || endingOdometer === '') {
    return res.status(400).json({ message: 'Ending odometer reading is required to complete the trip' });
  }
  if (fuelUsed === undefined || fuelUsed === null || fuelUsed === '') {
    return res.status(400).json({ message: 'Fuel consumed (liters) is required to complete the trip' });
  }

  const endOdo = Number(endingOdometer);
  const fuelConsumed = Number(fuelUsed);

  if (isNaN(endOdo) || endOdo < 0) {
    return res.status(400).json({ message: 'Ending odometer must be a valid non-negative number' });
  }
  if (isNaN(fuelConsumed) || fuelConsumed < 0) {
    return res.status(400).json({ message: 'Fuel consumed must be a valid non-negative number' });
  }

  try {
    // 1. Locate active trip
    const trip = await Trip.findOne({ dispatchId, status: 'In Progress' });
    if (!trip) {
      return res.status(404).json({ message: 'No active ongoing trip record located for this dispatch' });
    }

    const dispatch = await Dispatch.findById(dispatchId);
    if (!dispatch) {
      return res.status(404).json({ message: 'Parent dispatch record not found' });
    }

    // Ensure the driver can only end their own assigned dispatch
    if (req.user?.role === 'operator') {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User profile not found' });
      }
      const driver = await Driver.findOne({ email: user.email });
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }
      if (dispatch.driverId !== driver.id && dispatch.driverId !== driver._id.toString()) {
        return res.status(403).json({ message: 'Access denied: You are not authorized to end this trip as it is not assigned to you' });
      }
    }

    // Validate ending odometer against starting odometer
    const startOdo = (trip as any).startOdometer || 0;
    if (endOdo < startOdo) {
      return res.status(400).json({ message: `Ending odometer (${endOdo} km) cannot be less than starting odometer (${startOdo} km)` });
    }

    // 2. Calculate trip metrics from real driver input
    const endTime = new Date();
    const startTime = new Date(trip.startTime);
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.max(1, Math.round(durationMs / (1000 * 60)));
    const tripDistance = Number((endOdo - startOdo).toFixed(1));

    // 3. Persist Completed statuses with real readings
    trip.status = 'Completed';
    trip.endTime = endTime;
    trip.duration = durationMinutes;
    trip.distance = tripDistance;
    trip.fuelUsed = fuelConsumed;
    (trip as any).endOdometer = endOdo;
    await trip.save();

    // Update vehicle odometer to exact ending reading
    if (dispatch.vehicleId) {
      await Vehicle.findByIdAndUpdate(dispatch.vehicleId, {
        'telemetry.odometer': endOdo,
        'telemetry.updatedAt': new Date(),
      });
    }

    dispatch.status = 'Completed';
    await dispatch.save();

    // Release driver back to idle
    if (dispatch.driverId) {
      await Driver.findByIdAndUpdate(dispatch.driverId, { status: 'idle' });
    }

    // Release vehicle back to idle
    if (dispatch.vehicleId) {
      await Vehicle.findByIdAndUpdate(dispatch.vehicleId, { status: 'idle' });
    }

    console.log(`✅ Dispatch [${dispatch.referenceNumber}] completed. Distance: ${tripDistance} km, Fuel: ${fuelConsumed} L. Driver and Vehicle released.`);

    return res.json({
      ...trip.toJSON(),
      dispatch,
    });
  } catch (error: any) {
    console.error('End trip transaction failed:', error);
    return res.status(500).json({ message: 'Failed to process trip completion transaction' });
  }
});

export default router;
