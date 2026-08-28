import { Router, Response } from 'express';
import User from '../models/User';
import { verifyToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { requireFields, requireLength, collectErrors } from '../utils/validate';

const router = Router();

// Normalize a User doc into the shape the frontend expects (id instead of _id, no password)
function toSafeEmployee(employee: any) {
  return {
    id: employee._id.toString(),
    name: employee.name,
    email: employee.email,
    department: employee.department,
    employeeId: employee.employeeId,
    accountStatus: employee.accountStatus,
    rejectionReason: employee.rejectionReason,
    reviewedBy: employee.reviewedBy,
    reviewedAt: employee.reviewedAt,
    createdAt: employee.createdAt,
  };
}

// HTTP GET: List CRA employee account requests — admin + dispatcher
router.get('/', verifyToken, requireRole('admin', 'dispatcher'), async (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.query;
  const filter: any = { role: 'employee' };
  if (status) filter.accountStatus = status;

  try {
    const employees = await User.find(filter).select('-password').sort({ createdAt: -1 });
    return res.json(employees.map(toSafeEmployee));
  } catch (error: any) {
    console.error('Fetch employee accounts failed:', error);
    return res.status(500).json({ message: 'Failed to access employee account registry' });
  }
});

// HTTP POST: Approve a pending employee account request — admin + dispatcher
router.post('/:id/approve', verifyToken, requireRole('admin', 'dispatcher'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employee = await User.findOne({ _id: req.params.id, role: 'employee' });
    if (!employee) {
      return res.status(404).json({ message: 'Employee account request not found' });
    }
    if (employee.accountStatus !== 'pending') {
      return res.status(400).json({ message: `Cannot approve a request that is already ${employee.accountStatus}` });
    }

    const reviewer = await User.findById(req.user!.id);
    employee.accountStatus = 'approved';
    employee.reviewedBy = reviewer?.name;
    employee.reviewedAt = new Date();
    await employee.save();

    return res.json(toSafeEmployee(employee));
  } catch (error: any) {
    console.error('Approve employee account failed:', error);
    return res.status(500).json({ message: 'Failed to approve employee account request' });
  }
});

// HTTP POST: Reject a pending employee account request — admin + dispatcher
router.post('/:id/reject', verifyToken, requireRole('admin', 'dispatcher'), async (req: AuthenticatedRequest, res: Response) => {
  const { reason } = req.body;
  const errors = collectErrors(requireFields(req.body, ['reason']), requireLength('reason', reason, 5, 500));
  if (errors.length) {
    return res.status(400).json({ message: errors[0].message, errors });
  }

  try {
    const employee = await User.findOne({ _id: req.params.id, role: 'employee' });
    if (!employee) {
      return res.status(404).json({ message: 'Employee account request not found' });
    }
    if (employee.accountStatus !== 'pending') {
      return res.status(400).json({ message: `Cannot reject a request that is already ${employee.accountStatus}` });
    }

    const reviewer = await User.findById(req.user!.id);
    employee.accountStatus = 'rejected';
    employee.rejectionReason = reason;
    employee.reviewedBy = reviewer?.name;
    employee.reviewedAt = new Date();
    await employee.save();

    return res.json(toSafeEmployee(employee));
  } catch (error: any) {
    console.error('Reject employee account failed:', error);
    return res.status(500).json({ message: 'Failed to reject employee account request' });
  }
});

export default router;
