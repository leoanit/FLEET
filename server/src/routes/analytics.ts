import { Router, Request, Response } from 'express';
import { Vehicle } from '../models/Vehicle';
import { Driver } from '../models/Driver';
import { Dispatch } from '../models/Dispatch';
import { Trip } from '../models/Trip';
import { ServiceLog } from '../models/ServiceLog';
import { verifyToken, requireAdmin } from '../middleware/auth';

const router = Router();

// HTTP GET: Aggregate fleet KPI summary — admin + dispatcher (operators use the driver portal instead)
router.get('/summary', verifyToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Run all aggregation queries in parallel for performance
    const [vehicleStats, driverStats, dispatchStats, weeklyTripStats, recentAlerts] = await Promise.all([
      
      // Vehicle status breakdown
      Vehicle.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // Driver status and compliance breakdown
      Driver.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // Active dispatch count
      Dispatch.countDocuments({ status: 'In Progress' }),

      // Weekly trip performance (last 7 days)
      Trip.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            status: 'Completed',
          },
        },
        {
          $group: {
            _id: { $dayOfWeek: '$startTime' },
            tripCount: { $sum: 1 },
            totalDistance: { $sum: '$distance' },
            totalFuelUsed: { $sum: '$fuelUsed' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Compliance alerts: drivers with expiring/expired credentials
      Driver.countDocuments({
        'compliance.licenseStatus': { $in: ['expiring-soon', 'expired'] },
      }),
    ]);

    // Transform vehicle stats into a map
    const vehicleMap: Record<string, number> = {};
    vehicleStats.forEach((s: any) => { vehicleMap[s._id] = s.count; });
    const totalVehicles = Object.values(vehicleMap).reduce((a: number, b: number) => a + b, 0);
    const activeVehicles = vehicleMap['active'] || 0;
    const idleVehicles = vehicleMap['idle'] || 0;
    const maintenanceVehicles = vehicleMap['maintenance'] || 0;
    const offlineVehicles = vehicleMap['offline'] || 0;
    const fleetHealthScore = totalVehicles > 0
      ? Math.round(((totalVehicles - maintenanceVehicles - offlineVehicles) / totalVehicles) * 100)
      : 100;

    // Transform driver stats into a map
    const driverMap: Record<string, number> = {};
    driverStats.forEach((s: any) => { driverMap[s._id] = s.count; });
    const totalDrivers = Object.values(driverMap).reduce((a: number, b: number) => a + b, 0);
    const onTripDrivers = driverMap['on-trip'] || 0;
    const activeDrivers = driverMap['active'] || 0;
    const idleDrivers = driverMap['idle'] || 0;

    // Map day-of-week numbers to names
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyTrips = weeklyTripStats.map((day: any) => ({
      name: dayNames[(day._id - 1) % 7],
      tripCount: day.tripCount,
      totalDistance: Math.round(day.totalDistance),
      totalFuelUsed: Math.round(day.totalFuelUsed * 10) / 10,
    }));

    // Calculate preventative maintenance alerts for vehicles
    const allVehicles = await Vehicle.find({});
    const maintenanceAlerts = [];
    for (const v of allVehicles) {
      // Find the latest service log with nextServiceMileage defined
      const latestServiceLog = await ServiceLog.findOne({
        vehicleId: v._id.toString(),
        nextServiceMileage: { $exists: true, $ne: null }
      }).sort({ serviceDate: -1 });

      if (latestServiceLog && latestServiceLog.nextServiceMileage !== undefined && latestServiceLog.nextServiceMileage !== null) {
        const currentOdo = v.telemetry?.odometer || 0;
        // Trigger alert if current odometer is within 500 km/miles of next service mileage
        if (currentOdo >= latestServiceLog.nextServiceMileage - 500) {
          maintenanceAlerts.push({
            vehicleId: v._id.toString(),
            vehicleName: v.name,
            plateNumber: v.plateNumber,
            currentOdometer: currentOdo,
            nextServiceMileage: latestServiceLog.nextServiceMileage,
            serviceType: latestServiceLog.serviceType,
            remainingKm: Math.max(0, latestServiceLog.nextServiceMileage - currentOdo),
            status: v.status,
          });
        }
      }
    }

    return res.json({
      vehicles: {
        total: totalVehicles,
        active: activeVehicles,
        idle: idleVehicles,
        maintenance: maintenanceVehicles,
        offline: offlineVehicles,
        healthScore: fleetHealthScore,
      },
      drivers: {
        total: totalDrivers,
        onTrip: onTripDrivers,
        active: activeDrivers,
        idle: idleDrivers,
      },
      activeTripCount: dispatchStats,
      complianceAlerts: recentAlerts,
      maintenanceAlerts,
      weeklyTrips,
      generatedAt: new Date(),
    });
  } catch (error: any) {
    console.error('Analytics summary aggregation failed:', error);
    return res.status(500).json({ message: 'Failed to generate fleet analytics summary' });
  }
});

export default router;
