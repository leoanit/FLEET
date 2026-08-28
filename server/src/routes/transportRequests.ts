import { Router, Response } from 'express';
import { TransportRequest } from '../models/TransportRequest';
import User from '../models/User';
import { verifyToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { assignDispatch, DispatchAssignmentError } from '../services/dispatchAssignment';
import { requireFields, requireDate, requireLength, collectErrors } from '../utils/validate';

const router = Router();

// HTTP POST: Submit a new transport request — employee only
router.post('/', verifyToken, requireRole('employee'), async (req: AuthenticatedRequest, res: Response) => {
  const { origin, destination, purpose, travelDateTime } = req.body;

  const errors = collectErrors(
    requireFields(req.body, ['origin', 'destination', 'purpose', 'travelDateTime']),
    requireDate('travelDateTime', travelDateTime),
  );
  if (errors.length) {
    return res.status(400).json({ message: errors[0].message, errors });
  }

  try {
    const requester = await User.findById(req.user!.id);
    if (!requester) {
      return res.status(404).json({ message: 'Requesting user account not found' });
    }

    const request = new TransportRequest({
      requestedBy: req.user!.id,
      requesterName: requester.name,
      requesterEmail: requester.email,
      origin,
      destination,
      purpose,
      travelDateTime: new Date(travelDateTime),
    });
    await request.save();

    return res.status(201).json(request);
  } catch (error: any) {
    console.error('Create transport request failed:', error);
    return res.status(500).json({ message: 'Failed to submit transport request' });
  }
});

// HTTP GET: List transport requests — employees see only their own, admin/dispatcher see all
router.get('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.query;
  const filter: any = {};
  if (status) filter.status = status;
  if (req.user!.role === 'employee') filter.requestedBy = req.user!.id;

  try {
    const requests = await TransportRequest.find(filter).sort({ createdAt: -1 });
    return res.json(requests);
  } catch (error: any) {
    console.error('Fetch transport requests failed:', error);
    return res.status(500).json({ message: 'Failed to access transport request registry' });
  }
});

// HTTP GET: Fetch a specific transport request — ownership-checked for employees
router.get('/:id', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const request = await TransportRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Transport request not found' });
    }
    if (req.user!.role === 'employee' && request.requestedBy !== req.user!.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    return res.json(request);
  } catch (error: any) {
    console.error('Fetch transport request failed:', error);
    return res.status(500).json({ message: 'Failed to query transport request' });
  }
});

// HTTP POST: Approve a pending transport request — admin + dispatcher, assigns driver + vehicle
router.post('/:id/approve', verifyToken, requireRole('admin', 'dispatcher'), async (req: AuthenticatedRequest, res: Response) => {
  const { driverId, vehicleId, notes } = req.body;
  if (!driverId || !vehicleId) {
    return res.status(400).json({ message: 'A driver and vehicle must both be assigned to approve a transport request' });
  }

  try {
    const request = await TransportRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Transport request not found' });
    }
    if (request.status !== 'Pending') {
      return res.status(400).json({ message: `Cannot approve a request that is already ${request.status}` });
    }

    const dispatch = await assignDispatch({
      origin: request.origin,
      destination: request.destination,
      scheduledDate: request.travelDateTime,
      notes: notes || `CRA transport request ${request.referenceNumber} — ${request.purpose}`,
      driverId,
      vehicleId,
    });

    const reviewer = await User.findById(req.user!.id);
    request.status = 'Approved';
    request.dispatchId = dispatch.id;
    request.driverName = dispatch.driverName;
    request.vehicleName = dispatch.vehicleName;
    request.plateNumber = dispatch.plateNumber;
    request.reviewedBy = reviewer?.name;
    request.reviewedAt = new Date();
    await request.save();

    return res.status(201).json({ transportRequest: request, dispatch });
  } catch (error: any) {
    if (error instanceof DispatchAssignmentError) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('Approve transport request failed:', error);
    return res.status(500).json({ message: 'Failed to approve transport request' });
  }
});

// HTTP POST: Reject a pending transport request — admin + dispatcher, reason required
router.post('/:id/reject', verifyToken, requireRole('admin', 'dispatcher'), async (req: AuthenticatedRequest, res: Response) => {
  const { reason } = req.body;
  const errors = collectErrors(requireFields(req.body, ['reason']), requireLength('reason', reason, 5, 500));
  if (errors.length) {
    return res.status(400).json({ message: errors[0].message, errors });
  }

  try {
    const request = await TransportRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Transport request not found' });
    }
    if (request.status !== 'Pending') {
      return res.status(400).json({ message: `Cannot reject a request that is already ${request.status}` });
    }

    const reviewer = await User.findById(req.user!.id);
    request.status = 'Rejected';
    request.rejectionReason = reason;
    request.reviewedBy = reviewer?.name;
    request.reviewedAt = new Date();
    await request.save();

    return res.json(request);
  } catch (error: any) {
    console.error('Reject transport request failed:', error);
    return res.status(500).json({ message: 'Failed to reject transport request' });
  }
});

export default router;
