import { Router, Response } from 'express';
import { ServiceLog } from '../models/ServiceLog';
import { Vehicle } from '../models/Vehicle';
import { verifyToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// HTTP GET: Fetch all service logs across all vehicles
router.get('/service-logs', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await ServiceLog.find({}).sort({ serviceDate: -1 }).limit(100);
    return res.json(logs);
  } catch (error: any) {
    console.error('Fetch all service logs failed:', error);
    return res.status(500).json({ message: 'Failed to retrieve service log registry' });
  }
});

// HTTP GET: Fetch all service logs for a specific vehicle
router.get('/vehicles/:vehicleId/service-logs', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found in fleet registry' });
    }

    const logs = await ServiceLog.find({ vehicleId: req.params.vehicleId }).sort({ serviceDate: -1 });
    return res.json(logs);
  } catch (error: any) {
    console.error(`Fetch service logs for vehicle ${req.params.vehicleId} failed:`, error);
    return res.status(500).json({ message: 'Failed to retrieve service log history' });
  }
});

// HTTP POST: Create a new service log entry for a vehicle
router.post('/vehicles/:vehicleId/service-logs', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  const { serviceType, description, odometerAtService, cost, performedBy, serviceDate, nextServiceMileage } = req.body;

  if (!serviceType || odometerAtService === undefined) {
    return res.status(400).json({ message: 'Service type and odometer reading are required' });
  }

  try {
    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found in fleet registry' });
    }

    const log = new ServiceLog({
      vehicleId: req.params.vehicleId,
      vehicleName: vehicle.name,
      serviceType,
      description: description || '',
      odometerAtService,
      cost: cost || 0,
      performedBy: performedBy || '',
      serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
      nextServiceMileage: nextServiceMileage || undefined,
    });

    await log.save();

    // Update vehicle odometer if service odometer is higher
    if (odometerAtService > (vehicle.telemetry?.odometer || 0)) {
      await Vehicle.findByIdAndUpdate(req.params.vehicleId, {
        'telemetry.odometer': odometerAtService,
        'telemetry.updatedAt': new Date(),
      });
    }

    return res.status(201).json(log);
  } catch (error: any) {
    console.error(`Create service log for vehicle ${req.params.vehicleId} failed:`, error);
    return res.status(500).json({ message: 'Failed to record service log entry' });
  }
});

// HTTP DELETE: Remove a specific service log (Admin only)
router.delete('/service-logs/:logId', verifyToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const log = await ServiceLog.findById(req.params.logId);
    if (!log) {
      return res.status(404).json({ message: 'Service log entry not found' });
    }

    await ServiceLog.findByIdAndDelete(req.params.logId);
    return res.json({ message: 'Service log entry successfully removed' });
  } catch (error: any) {
    console.error(`Delete service log ${req.params.logId} failed:`, error);
    return res.status(500).json({ message: 'Failed to delete service log entry' });
  }
});

export default router;
