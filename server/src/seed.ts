import { User } from './models/User';
import { Vehicle } from './models/Vehicle';
import { Driver } from './models/Driver';
import { Dispatch } from './models/Dispatch';
import { ServiceLog } from './models/ServiceLog';
import { Trip } from './models/Trip';

export const seedDatabase = async () => {
  try {
    // 1. Verify and seed management users
    // Admin account — full system access including vehicle/driver creation & deletion
    const adminExists: any = await User.findOne({ email: 'admin@fleetos.com' });
    if (!adminExists) {
      const adminUser = new User({
        name: 'System Administrator',
        email: 'admin@fleetos.com',
        password: 'admin123',
        role: 'admin',
        mustChangePassword: false,
      });
      await adminUser.save();
      console.log('✅ Created admin account (Credentials: admin@fleetos.com / admin123)');
    } else {
      const isMatch = await adminExists.comparePassword('admin123');
      if (!isMatch) {
        adminExists.password = 'admin123';
        adminExists.mustChangePassword = false;
        await adminExists.save();
        console.log('✅ Synchronized admin account password to default (admin123)');
      }
    }

    // Dispatcher account — day-to-day operations (create dispatches, update vehicles/drivers)
    const dispatcherExists: any = await User.findOne({ email: 'dispatcher@fleetos.com' });
    if (!dispatcherExists) {
      const dispatcherUser = new User({
        name: 'Grace Wanjiku',
        email: 'dispatcher@fleetos.com',
        password: 'dispatcher123',
        role: 'dispatcher',
        mustChangePassword: false,
      });
      await dispatcherUser.save();
      console.log('✅ Created dispatcher account (Credentials: dispatcher@fleetos.com / dispatcher123)');
    } else {
      const isMatch = await dispatcherExists.comparePassword('dispatcher123');
      if (!isMatch) {
        dispatcherExists.password = 'dispatcher123';
        dispatcherExists.mustChangePassword = false;
        await dispatcherExists.save();
        console.log('✅ Synchronized dispatcher account password to default (dispatcher123)');
      }
    }

    // 2. Verify and seed certified operators (Drivers)
    const driverCount = await Driver.countDocuments();
    let seededDrivers: any[] = [];
    if (driverCount === 0) {
      console.log('🌱 Database seeding: Seeding certified operator registry with Kenyan names...');
      const driversData = [
        {
          name: 'David Mwangi',
          email: 'david.mwangi@fleetos.co.ke',
          phone: '+254 712 345678',
          status: 'active',
          tripsCompleted: 142,
          rating: 4.9,
          compliance: {
            licenseClass: 'Heavy Commercial DL',
            licenseNumber: 'KE-DL-9048-KM',
            licenseExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 2), // 2 years out
            licenseStatus: 'compliant',
          },
          performance: {
            safetyScore: 96,
            fuelEfficiencyScore: 91,
            onTimeDeliveryRate: 98.4,
            weeklyHoursLogged: 42.5
          },
          notes: [
            { id: 'n-1', author: 'Grace Wanjiku', content: 'Completed long-haul Mombasa-to-Nairobi transit ahead of schedule. Fuel logs fully compliant.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) }
          ],
        },
        {
          name: 'Emmy Kosgei',
          email: 'emmy.kosgei@fleetos.co.ke',
          phone: '+254 750 999888',
          status: 'idle',
          tripsCompleted: 23,
          rating: 4.8,
          compliance: {
            licenseClass: 'Light Commercial DL',
            licenseNumber: 'KE-DL-8820-EK',
            licenseExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year out
            licenseStatus: 'compliant',
          },
          performance: {
            safetyScore: 98,
            fuelEfficiencyScore: 92,
            onTimeDeliveryRate: 97.5,
            weeklyHoursLogged: 20.0
          },
          notes: [],
        },
        {
          name: 'Alice Wanjiku',
          email: 'alice.wanjiku@fleetos.co.ke',
          phone: '+254 722 987654',
          status: 'idle',
          tripsCompleted: 98,
          rating: 4.7,
          compliance: {
            licenseClass: 'Light Commercial DL',
            licenseNumber: 'KE-DL-4412-AW',
            licenseExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20), // Expiring in 20 days
            licenseStatus: 'expiring-soon',
          },
          performance: {
            safetyScore: 92,
            fuelEfficiencyScore: 86,
            onTimeDeliveryRate: 95.2,
            weeklyHoursLogged: 34.0
          },
          notes: [
            { id: 'n-2', author: 'Grace Wanjiku', content: 'Warning issued regarding license expiration approaching. Driver advised to renew CDL credentials immediately.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) }
          ],
        },
        {
          name: 'Peter Kiprop',
          email: 'peter.kiprop@fleetos.co.ke',
          phone: '+254 733 111222',
          status: 'on-trip',
          tripsCompleted: 210,
          rating: 4.8,
          compliance: {
            licenseClass: 'Heavy Commercial DL',
            licenseNumber: 'KE-DL-1129-PK',
            licenseExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
            licenseStatus: 'compliant',
          },
          performance: {
            safetyScore: 89,
            fuelEfficiencyScore: 94,
            onTimeDeliveryRate: 99.1,
            weeklyHoursLogged: 55.2
          },
          notes: [],
        },
        {
          name: 'Joseph Otieno',
          email: 'joseph.otieno@fleetos.co.ke',
          phone: '+254 740 444333',
          status: 'offline',
          tripsCompleted: 54,
          rating: 4.2,
          compliance: {
            licenseClass: 'Standard DL Class C',
            licenseNumber: 'KE-DL-9821-JO',
            licenseExpiry: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // Expired 5 days ago
            licenseStatus: 'expired',
          },
          performance: {
            safetyScore: 78,
            fuelEfficiencyScore: 80,
            onTimeDeliveryRate: 88.5,
            weeklyHoursLogged: 0
          },
          notes: [
            { id: 'n-3', author: 'Grace Wanjiku', content: 'URGENT: Suspended from operations due to expired licensing and NTSA physical documentation.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4) }
          ],
        }
      ];

      seededDrivers = await Driver.insertMany(driversData);
      console.log(`✅ Seeded ${seededDrivers.length} certified operators successfully.`);
    } else {
      seededDrivers = await Driver.find({});
    }

    // Ensure every driver profile has a linked User login account — runs on every
    // startup (not just when Driver profiles are first created) so it self-heals
    // if a driver's login was ever deleted independently of their profile.
    let createdDriverLogins = 0;
    for (const d of seededDrivers) {
      const userExists = await User.findOne({ email: d.email });
      if (!userExists) {
        const driverUser = new User({
          name: d.name,
          email: d.email,
          password: 'driver123',
          role: 'operator',
          mustChangePassword: false,
        });
        await driverUser.save();
        console.log(`   • ${d.email} / driver123`);
        createdDriverLogins++;
      }
    }
    if (createdDriverLogins > 0) {
      console.log(`✅ Created ${createdDriverLogins} missing driver login account(s) (default password: driver123).`);
    }

    // 3. Verify and seed vehicle assets (linked with seeded drivers)
    const vehicleCount = await Vehicle.countDocuments();
    if (vehicleCount === 0) {
      console.log('🌱 Database seeding: Seeding Kenyan vehicle asset fleet...');
      
      const findDriverId = (name: string) => {
        const found = seededDrivers.find(d => d.name === name);
        return found ? found.id : undefined;
      };

      const vehiclesData = [
        {
          name: 'Heavy Duty Isuzu FSR Truck',
          plateNumber: 'KCD 739F',
          make: 'Isuzu',
          model: 'FSR 33L',
          year: 2022,
          type: 'truck',
          status: 'idle',
          telemetry: {
            latitude: -1.2921,
            longitude: 36.8219,
            speed: 62,
            heading: 180,
            odometer: 124500,
            fuelLevel: 74,
            locationName: 'Nairobi',
          },
          assignedDriverId: findDriverId('David Mwangi'),
          assignedDriverName: 'David Mwangi',
        },
        {
          name: 'Toyota Hiace Delivery Van',
          plateNumber: 'KDA 441L',
          make: 'Toyota',
          model: 'Hiace Super GL',
          year: 2021,
          type: 'van',
          status: 'idle',
          telemetry: {
            latitude: -1.2863,
            longitude: 36.8172,
            speed: 0,
            heading: 90,
            odometer: 48200,
            fuelLevel: 98,
            locationName: 'Nairobi',
          },
          assignedDriverId: findDriverId('Alice Wanjiku'),
          assignedDriverName: 'Alice Wanjiku',
        },
        {
          name: 'Long-haul Scania R450 Flatbed',
          plateNumber: 'KCA 882P',
          make: 'Scania',
          model: 'R450 Flatbed',
          year: 2023,
          type: 'truck',
          status: 'active',
          telemetry: {
            latitude: -4.0435,
            longitude: 39.6682,
            speed: 55,
            heading: 270,
            odometer: 89300,
            fuelLevel: 42,
            locationName: 'Mombasa',
          },
          assignedDriverId: findDriverId('Peter Kiprop'),
          assignedDriverName: 'Peter Kiprop',
        },
        {
          name: 'Isuzu D-Max Service Utility',
          plateNumber: 'KBZ 110S',
          make: 'Isuzu',
          model: 'D-Max TFS85',
          year: 2019,
          type: 'van',
          status: 'maintenance',
          telemetry: {
            latitude: -0.3030,
            longitude: 36.0800,
            speed: 0,
            heading: 0,
            odometer: 142000,
            fuelLevel: 15,
            locationName: 'Nakuru',
          },
          assignedDriverId: undefined,
          assignedDriverName: undefined,
        }
      ];

      const seededVehicles = await Vehicle.insertMany(vehiclesData);
      console.log(`✅ Seeded ${seededVehicles.length} vehicles successfully.`);

      // 4. Update the Drivers back with their assigned vehicle IDs to maintain sync
      for (const vehicle of seededVehicles) {
        if (vehicle.assignedDriverId) {
          await Driver.findByIdAndUpdate(vehicle.assignedDriverId, {
            assignedVehicleId: vehicle.id,
            assignedVehicleName: vehicle.name,
          });
        }
      }
      console.log('✅ Synchronized bidirectional vehicle/driver assignments.');
    }

    // 4. Verify and seed dispatch records
    const dispatchCount = await Dispatch.countDocuments();
    if (dispatchCount === 0 && seededDrivers.length > 0) {
      console.log('🌱 Database seeding: Seeding Kenyan route dispatch ledger records...');
      const seededVehiclesList = await Vehicle.find({});
      
      const findV = (plate: string) => seededVehiclesList.find((v: any) => v.plateNumber === plate);
      const findD = (name: string) => seededDrivers.find((d: any) => d.name === name);

      const dispatches = [
        {
          origin: 'Mombasa Port Terminal',
          destination: 'Nairobi Inland Container Depot (ICD)',
          scheduledDate: new Date(Date.now() - 1000 * 60 * 60 * 2),
          status: 'In Progress',
          driverId: findD('Peter Kiprop')?._id?.toString(),
          driverName: 'Peter Kiprop',
          vehicleId: findV('KCA 882P')?._id?.toString(),
          vehicleName: 'Long-haul Scania R450 Flatbed',
          plateNumber: 'KCA 882P',
          notes: 'Priority cargo delivery from port. Secure container properly.',
        },
        {
          origin: 'Thika Industrial Zone',
          destination: 'Nairobi Depot',
          scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 3),
          status: 'Assigned',
          driverId: findD('David Mwangi')?._id?.toString(),
          driverName: 'David Mwangi',
          vehicleId: findV('KCD 739F')?._id?.toString(),
          vehicleName: 'Heavy Duty Isuzu FSR Truck',
          plateNumber: 'KCD 739F',
          notes: 'Standard FMCG supplies load.',
        },
        {
          origin: 'Eldoret Grain Silos',
          destination: 'Kisumu Port Hub',
          scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
          status: 'Pending',
          notes: 'Awaiting grain loading clearance.',
        },
        {
          origin: 'Nakuru Logistics Hub',
          destination: 'Nairobi Inland Container Depot (ICD)',
          scheduledDate: new Date(Date.now() - 1000 * 60 * 60 * 48),
          status: 'Completed',
          driverId: findD('Alice Wanjiku')?._id?.toString(),
          driverName: 'Alice Wanjiku',
          vehicleId: findV('KDA 441L')?._id?.toString(),
          vehicleName: 'Toyota Hiace Delivery Van',
          plateNumber: 'KDA 441L',
          notes: 'Delivered fresh farm produce package successfully.',
        },
      ];

      const seededDispatches = [];
      for (const d of dispatches) {
        const dispatch = new Dispatch(d);
        await dispatch.save();
        seededDispatches.push(dispatch);
      }
      console.log(`✅ Seeded ${seededDispatches.length} dispatch records.`);

      // Create a completed trip for the completed dispatch
      const completedDispatch = seededDispatches.find((d: any) => d.status === 'Completed');
      if (completedDispatch) {
        const completedTrip = new Trip({
          dispatchId: completedDispatch._id.toString(),
          startTime: new Date(Date.now() - 1000 * 60 * 60 * 46),
          endTime: new Date(Date.now() - 1000 * 60 * 60 * 44),
          status: 'Completed',
          distance: 142.5,
          fuelUsed: 18.2,
          duration: 122,
        });
        await completedTrip.save();
        console.log('✅ Seeded completed trip record.');
      }

      // Create an in-progress trip for the in-progress dispatch
      const inProgressDispatch = seededDispatches.find((d: any) => d.status === 'In Progress');
      if (inProgressDispatch) {
        const associatedVehicle = seededVehiclesList.find((v: any) => v.plateNumber === 'KCA 882P');
        const activeTrip = new Trip({
          dispatchId: inProgressDispatch._id.toString(),
          startTime: new Date(Date.now() - 1000 * 60 * 90),
          status: 'In Progress',
          startOdometer: associatedVehicle ? (associatedVehicle.telemetry?.odometer || 0) : 0,
        });
        await activeTrip.save();
        console.log('✅ Seeded active in-progress trip record with startOdometer.');
      }
    }

    // 5. Verify and seed service log records
    const serviceLogCount = await ServiceLog.countDocuments();
    if (serviceLogCount === 0) {
      console.log('🌱 Database seeding: Seeding vehicle service history logs...');
      const seededVehiclesList = await Vehicle.find({});
      
      const logs: any[] = [];
      for (const vehicle of seededVehiclesList) {
        logs.push(
          {
            vehicleId: vehicle._id.toString(),
            vehicleName: vehicle.name,
            serviceType: 'oil-change',
            description: 'Full synthetic heavy vehicle engine oil change and premium filter replacement.',
            odometerAtService: Math.max(0, (vehicle.telemetry?.odometer || 0) - 5000),
            cost: 18500.00,
            performedBy: 'Nairobi Expressway Service Centre',
            serviceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
            nextServiceMileage: (vehicle.telemetry?.odometer || 0) + 5000,
          },
          {
            vehicleId: vehicle._id.toString(),
            vehicleName: vehicle.name,
            serviceType: 'tire-rotation',
            description: 'Full multi-wheel alignment, rotation, and balance diagnostics.',
            odometerAtService: Math.max(0, (vehicle.telemetry?.odometer || 0) - 12000),
            cost: 7500.00,
            performedBy: 'Mombasa Road Tyre Clinic',
            serviceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120),
            nextServiceMileage: (vehicle.telemetry?.odometer || 0) + 8000,
          }
        );
      }

      await ServiceLog.insertMany(logs);
      console.log(`✅ Seeded ${logs.length} service log records for ${seededVehiclesList.length} vehicles.`);
    }
  } catch (error) {
    console.error('❌ Failed to seed database collections:', error);
  }
};
export default seedDatabase;
