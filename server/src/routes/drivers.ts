import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { Driver } from '../models/Driver';
import { Vehicle } from '../models/Vehicle';
import { User } from '../models/User';
import { collectErrors, requireFields, requireEmail, requireLength, requireDate } from '../utils/validate';
import { verifyToken, requireAdmin, requireRole } from '../middleware/auth';

const router = Router();

// HTTP GET: Fetch Operator Registry manifest — admin + dispatcher only
router.get('/', verifyToken, requireAdmin, async (req: Request, res: Response) => {
  const { status } = req.query;
  const filter: any = {};
  
  if (status) {
    filter.status = status;
  }

  try {
    const drivers = await Driver.find(filter).sort({ createdAt: -1 });
    return res.json(drivers);
  } catch (error: any) {
    console.error('Fetch drivers failed:', error);
    return res.status(500).json({ message: 'Failed to query operator database registry' });
  }
});

// HTTP GET: Fetch Certified Operator dossier details — all authenticated (operators can view own profile)
router.get('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Operator dossier file not found' });
    }
    return res.json(driver);
  } catch (error: any) {
    console.error(`Fetch driver ${req.params.id} failed:`, error);
    return res.status(500).json({ message: 'Failed to access operator credentials dossier' });
  }
});

// HTTP POST: Enroll Certified Logistics Operator — admin only (also creates a User account)
router.post('/', verifyToken, requireRole('admin'), async (req: Request, res: Response) => {
  const {
    name,
    email,
    phone,
    status,
    licenseClass,
    licenseNumber,
    licenseExpiry,
  } = req.body;

  const errors = collectErrors(
    requireFields(req.body, ['name', 'email', 'phone', 'licenseClass', 'licenseNumber', 'licenseExpiry']),
    requireEmail('email', email),
    requireLength('name', name, 2, 100),
    requireLength('phone', phone, 7, 20),
    requireLength('licenseNumber', licenseNumber, 3, 30),
    requireDate('licenseExpiry', licenseExpiry),
  );
  if (errors.length > 0) {
    return res.status(400).json({ message: errors[0].message, errors });
  }

  try {
    // 1. Verify email uniqueness
    const exists = await Driver.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: 'An operator with this email is already registered' });
    }

    // 2. Determine initial compliance status
    const expiry = new Date(licenseExpiry);
    const now = new Date();
    let licenseStatus = 'compliant';
    if (expiry < now) {
      licenseStatus = 'expired';
    } else if (expiry.getTime() - now.getTime() < 1000 * 60 * 60 * 24 * 30) {
      licenseStatus = 'expiring-soon';
    }

    // 3. Create and save new Mongoose model
    const driver = new Driver({
      name,
      email,
      phone,
      status: status || 'idle',
      tripsCompleted: 0,
      rating: 5.0,
      compliance: {
        licenseClass,
        licenseNumber,
        licenseExpiry: expiry.toISOString(),
        licenseStatus,
      },
      performance: {
        safetyScore: 100,
        fuelEfficiencyScore: 100,
        onTimeDeliveryRate: 100,
        weeklyHoursLogged: 0
      },
      notes: []
    });

    await driver.save();

    // Automatically create User credentials for the newly enrolled driver.
    // Generate a unique temporary password — returned once so the dispatcher
    // can share it with the driver. Never stored in plain text (bcrypt hashes it).
    let temporaryPassword: string | undefined;
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (!userExists) {
      temporaryPassword = randomBytes(8).toString('hex');
      const driverUser = new User({
        name,
        email: email.toLowerCase(),
        password: temporaryPassword,
        role: 'operator',
        mustChangePassword: true,
      });
      await driverUser.save();
    }

    return res.status(201).json({
      ...driver.toJSON(),
      ...(temporaryPassword && {
        _credentials: {
          email: email.toLowerCase(),
          temporaryPassword,
          note: 'Share this with the driver. This password is shown only once.',
        },
      }),
    });
  } catch (error: any) {
    console.error('Enroll driver failed:', error);
    return res.status(500).json({ message: 'Database transaction error registering operator' });
  }
});

// HTTP PUT: Modify Operator Credentials Dossier — admin + dispatcher
router.put('/:id', verifyToken, requireAdmin, async (req: Request, res: Response) => {
  const { 
    name, 
    email, 
    phone, 
    status, 
    licenseClass, 
    licenseNumber, 
    licenseExpiry,
    assignedVehicleId
  } = req.body;

  const updateErrors = collectErrors(
    requireEmail('email', email),
    requireLength('name', name, 2, 100),
    requireLength('phone', phone, 7, 20),
    requireDate('licenseExpiry', licenseExpiry),
  );
  if (updateErrors.length > 0) {
    return res.status(400).json({ message: updateErrors[0].message, errors: updateErrors });
  }

  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Operator credentials file not found' });
    }

    // 1. Handle dynamic vehicle asset assignment sync updates
    let assignedVehicleName = driver.assignedVehicleName;
    if (assignedVehicleId !== undefined && assignedVehicleId !== driver.assignedVehicleId) {
      if (assignedVehicleId) {
        const newVehicle = await Vehicle.findById(assignedVehicleId);
        if (!newVehicle) {
          return res.status(404).json({ message: 'Vehicle asset not located for dispatch assignment' });
        }
        assignedVehicleName = newVehicle.name;

        // Clear any old vehicle's driver reference
        if (driver.assignedVehicleId) {
          await Vehicle.findByIdAndUpdate(driver.assignedVehicleId, {
            assignedDriverId: undefined,
            assignedDriverName: undefined,
          });
        }

        // Set the new vehicle's driver reference
        await Vehicle.findByIdAndUpdate(assignedVehicleId, {
          assignedDriverId: driver.id,
          assignedDriverName: name || driver.name,
        });
      } else {
        // Clearing vehicle assignment
        assignedVehicleName = undefined;
        if (driver.assignedVehicleId) {
          await Vehicle.findByIdAndUpdate(driver.assignedVehicleId, {
            assignedDriverId: undefined,
            assignedDriverName: undefined,
          });
        }
      }
    }

    // 2. Perform driver document updates
    driver.name = name || driver.name;
    driver.email = email || driver.email;
    driver.phone = phone || driver.phone;
    driver.status = status || driver.status;
    driver.assignedVehicleId = assignedVehicleId !== undefined ? assignedVehicleId : driver.assignedVehicleId;
    driver.assignedVehicleName = assignedVehicleName;

    // Handle nested compliance updates
    if (driver.compliance) {
      driver.compliance.licenseClass = licenseClass || driver.compliance.licenseClass;
      driver.compliance.licenseNumber = licenseNumber || driver.compliance.licenseNumber;
      
      if (licenseExpiry) {
        const expiry = new Date(licenseExpiry);
        const now = new Date();
        driver.compliance.licenseExpiry = expiry;
        
        let licenseStatus = 'compliant';
        if (expiry < now) {
          licenseStatus = 'expired';
        } else if (expiry.getTime() - now.getTime() < 1000 * 60 * 60 * 24 * 30) {
          licenseStatus = 'expiring-soon';
        }
        driver.compliance.licenseStatus = licenseStatus as any;
      }

    }

    await driver.save();
    return res.json(driver);
  } catch (error: any) {
    console.error(`Update driver ${req.params.id} failed:`, error);
    return res.status(500).json({ message: 'Failed to synchronize operator updates' });
  }
});

// HTTP DELETE: Decommission Logistics Operator — admin only
router.delete('/:id', verifyToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Operator not found in registry database' });
    }

    // 1. Sever and clear assignments on active vehicle asset documents
    if (driver.assignedVehicleId) {
      await Vehicle.findByIdAndUpdate(driver.assignedVehicleId, {
        assignedDriverId: undefined,
        assignedDriverName: undefined,
      });
    }

    // 2. Delete driver registry file
    await Driver.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Logistics operator successfully decommissioned from service' });
  } catch (error: any) {
    console.error(`Decommission driver ${req.params.id} failed:`, error);
    return res.status(500).json({ message: 'Failed to decommission operator from databases' });
  }
});

// HTTP POST: Reset operator login password — admin only
router.post('/:id/reset-password', verifyToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Operator not found in registry' });
    }

    const user = await User.findOne({ email: driver.email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No login account found for this operator' });
    }

    const temporaryPassword = randomBytes(8).toString('hex');
    user.password = temporaryPassword;
    user.mustChangePassword = true;
    await user.save();

    return res.json({
      email: driver.email,
      temporaryPassword,
      note: 'Share this with the driver. This password is shown only once.',
    });
  } catch (error: any) {
    console.error(`Reset password for driver ${req.params.id} failed:`, error);
    return res.status(500).json({ message: 'Failed to reset operator password' });
  }
});

// HTTP POST: Append dispatcher administrative note to Operator Journal — admin + dispatcher
router.post('/:id/notes', verifyToken, requireAdmin, async (req: Request, res: Response) => {
  const { author, content } = req.body;

  if (!author || !content) {
    return res.status(400).json({ message: 'Note author and comment body are required' });
  }

  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Operator record not found' });
    }

    // Append nested note entry to notes array
    const newNote = {
      id: `n-${Date.now()}`,
      author,
      content,
      createdAt: new Date()
    };

    driver.notes.unshift(newNote);
    await driver.save();

    return res.status(201).json(driver);
  } catch (error: any) {
    console.error(`Add note to driver ${req.params.id} failed:`, error);
    return res.status(500).json({ message: 'Failed to append comment to operator profile' });
  }
});

export default router;
