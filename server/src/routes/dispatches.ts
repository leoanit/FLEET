import { Router, Request, Response } from 'express';
import { Dispatch } from '../models/Dispatch';
import { Driver } from '../models/Driver';
import { Vehicle } from '../models/Vehicle';
import { verifyToken, requireAdmin } from '../middleware/auth';
import { assignDispatch, DispatchAssignmentError } from '../services/dispatchAssignment';

const router = Router();

// HTTP GET: Fetch dispatches ledger — all authenticated (operators find their assigned dispatch)
router.get('/', verifyToken, async (req: Request, res: Response) => {
  const { status } = req.query;
  const filter: any = {};
  
  if (status) {
    filter.status = status;
  }

  try {
    const dispatches = await Dispatch.find(filter).sort({ createdAt: -1 });
    return res.json(dispatches);
  } catch (error: any) {
    console.error('Fetch dispatches failed:', error);
    return res.status(500).json({ message: 'Failed to access dispatches database registry' });
  }
});

// HTTP GET: Fetch specific Dispatch details by ID — all authenticated
router.get('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const dispatch = await Dispatch.findById(req.params.id);
    if (!dispatch) {
      return res.status(404).json({ message: 'Dispatch record not found' });
    }
    return res.json(dispatch);
  } catch (error: any) {
    console.error(`Fetch dispatch ${req.params.id} failed:`, error);
    return res.status(500).json({ message: 'Failed to query dispatch ledger details' });
  }
});

// HTTP POST: Create a new Dispatch assignment — admin + dispatcher
router.post('/', verifyToken, requireAdmin, async (req: Request, res: Response) => {
  const { origin, destination, scheduledDate, notes, driverId, vehicleId } = req.body;

  if (!origin || !destination || !scheduledDate) {
    return res.status(400).json({ message: 'Origin, destination, and scheduled date are required parameters' });
  }

  try {
    const dispatch = await assignDispatch({
      origin,
      destination,
      scheduledDate: new Date(scheduledDate),
      notes,
      driverId,
      vehicleId,
    });
    return res.status(201).json(dispatch);
  } catch (error: any) {
    if (error instanceof DispatchAssignmentError) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('Create dispatch failed:', error);
    return res.status(500).json({ message: 'Failed to record dispatch in database' });
  }
});

// HTTP PUT: Modify/Update dispatch logistics and allocations — admin + dispatcher
router.put('/:id', verifyToken, requireAdmin, async (req: Request, res: Response) => {
  const { origin, destination, scheduledDate, notes, status, driverId, vehicleId } = req.body;

  try {
    const dispatch = await Dispatch.findById(req.params.id);
    if (!dispatch) {
      return res.status(404).json({ message: 'Dispatch record not located' });
    }

    const oldDriverId = dispatch.driverId;
    const oldVehicleId = dispatch.vehicleId;

    // Protect finished dispatches from modifications
    if (dispatch.status === 'Completed' || dispatch.status === 'Cancelled') {
      return res.status(400).json({ message: `Cannot modify a closed dispatch (Status: ${dispatch.status})` });
    }

    // Update logistics if provided
    if (origin) dispatch.origin = origin;
    if (destination) dispatch.destination = destination;
    if (scheduledDate) dispatch.scheduledDate = new Date(scheduledDate);
    if (notes !== undefined) dispatch.notes = notes;

    // Verify and handle driver assignments
    if (driverId !== undefined) {
      if (driverId) {
        if (driverId !== dispatch.driverId) {
          const driver = await Driver.findById(driverId);
          if (!driver) {
            return res.status(404).json({ message: 'Target driver profile not found' });
          }

          if (driver.status === 'on-trip') {
            return res.status(400).json({ message: 'Selected driver is currently active on another trip' });
          }

          const activeBookings = await Dispatch.findOne({
            driverId,
            _id: { $ne: dispatch._id },
            status: { $in: ['Assigned', 'In Progress'] }
          });
          if (activeBookings) {
            return res.status(400).json({ message: 'Selected driver is already allocated to another active/assigned dispatch' });
          }

          dispatch.driverId = driverId;
          dispatch.driverName = driver.name;
        }
      } else {
        // Clear driver
        dispatch.driverId = undefined;
        dispatch.driverName = undefined;
      }
    }

    // Verify and handle vehicle assignments
    if (vehicleId !== undefined) {
      if (vehicleId) {
        if (vehicleId !== dispatch.vehicleId) {
          const vehicle = await Vehicle.findById(vehicleId);
          if (!vehicle) {
            return res.status(404).json({ message: 'Target vehicle record not found' });
          }

          if (vehicle.status === 'active' || vehicle.status === 'maintenance') {
            return res.status(400).json({ message: `Selected vehicle is unavailable (Status: ${vehicle.status})` });
          }

          const activeBookings = await Dispatch.findOne({
            vehicleId,
            _id: { $ne: dispatch._id },
            status: { $in: ['Assigned', 'In Progress'] }
          });
          if (activeBookings) {
            return res.status(400).json({ message: 'Selected vehicle is already allocated to another active/assigned dispatch' });
          }

          dispatch.vehicleId = vehicleId;
          dispatch.vehicleName = vehicle.name;
          dispatch.plateNumber = vehicle.plateNumber;
        }
      } else {
        // Clear vehicle
        dispatch.vehicleId = undefined;
        dispatch.vehicleName = undefined;
        dispatch.plateNumber = undefined;
      }
    }

    // Update operational status
    if (status) {
      if (status === 'Cancelled') {
        dispatch.status = 'Cancelled';
      } else if (status === 'Assigned' || status === 'Pending') {
        // Dynamically shift between Assigned/Pending depending on assets presence
        if (dispatch.driverId && dispatch.vehicleId) {
          dispatch.status = 'Assigned';
        } else {
          dispatch.status = 'Pending';
        }
      } else {
        dispatch.status = status;
      }
    } else {
      // Re-evaluate status automatically if assets changed
      if (dispatch.status === 'Pending' || dispatch.status === 'Assigned') {
        if (dispatch.driverId && dispatch.vehicleId) {
          dispatch.status = 'Assigned';
        } else {
          dispatch.status = 'Pending';
        }
      }
    }

    await dispatch.save();

    // Re-evaluate driver status transitions
    if (dispatch.driverId !== oldDriverId) {
      if (oldDriverId) {
        await Driver.findByIdAndUpdate(oldDriverId, { status: 'idle' });
      }
      if (dispatch.driverId) {
        const newStatus = dispatch.status === 'In Progress' ? 'on-trip' : 'active';
        await Driver.findByIdAndUpdate(dispatch.driverId, { status: newStatus });
      }
    }

    // Re-evaluate vehicle status transitions
    if (dispatch.vehicleId !== oldVehicleId) {
      if (oldVehicleId) {
        await Vehicle.findByIdAndUpdate(oldVehicleId, { status: 'idle' });
      }
      if (dispatch.vehicleId) {
        const newVehicleStatus = dispatch.status === 'In Progress' ? 'active' : 'idle';
        await Vehicle.findByIdAndUpdate(dispatch.vehicleId, { status: newVehicleStatus });
      }
    }

    // Synchronize statuses based on global status shift (Cancellation or Completion)
    if (dispatch.status === 'Cancelled' || dispatch.status === 'Completed') {
      if (dispatch.driverId) {
        await Driver.findByIdAndUpdate(dispatch.driverId, { status: 'idle' });
      }
      if (dispatch.vehicleId) {
        await Vehicle.findByIdAndUpdate(dispatch.vehicleId, { status: 'idle' });
      }
    } else if (dispatch.status === 'In Progress') {
      if (dispatch.driverId) {
        await Driver.findByIdAndUpdate(dispatch.driverId, { status: 'on-trip' });
      }
      if (dispatch.vehicleId) {
        await Vehicle.findByIdAndUpdate(dispatch.vehicleId, { status: 'active' });
      }
    } else if (dispatch.status === 'Assigned') {
      if (dispatch.driverId) {
        await Driver.findByIdAndUpdate(dispatch.driverId, { status: 'active' });
      }
      if (dispatch.vehicleId) {
        await Vehicle.findByIdAndUpdate(dispatch.vehicleId, { status: 'idle' });
      }
    }

    return res.json(dispatch);
  } catch (error: any) {
    console.error(`Update dispatch ${req.params.id} failed:`, error);
    return res.status(500).json({ message: 'Failed to update dispatch parameters' });
  }
});

// HTTP DELETE: Delete a Dispatch assignment — admin + dispatcher
router.delete('/:id', verifyToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const dispatch = await Dispatch.findById(req.params.id);
    if (!dispatch) {
      return res.status(404).json({ message: 'Dispatch record not located' });
    }

    if (dispatch.status === 'In Progress' || dispatch.status === 'Assigned' || dispatch.status === 'Completed') {
      return res.status(400).json({ message: `Cannot delete a dispatch that is in status: ${dispatch.status}` });
    }

    await Dispatch.findByIdAndDelete(req.params.id);

    // Release assigned assets back to idle if deleted
    if (dispatch.driverId) {
      await Driver.findByIdAndUpdate(dispatch.driverId, { status: 'idle' });
    }
    if (dispatch.vehicleId) {
      await Vehicle.findByIdAndUpdate(dispatch.vehicleId, { status: 'idle' });
    }

    return res.json({ message: 'Dispatch assignment successfully deleted' });
  } catch (error: any) {
    console.error(`Delete dispatch ${req.params.id} failed:`, error);
    return res.status(500).json({ message: 'Failed to delete dispatch from database registers' });
  }
});

export default router;
