import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { requireEmail, requireEmailDomain, requireFields, collectErrors } from '../utils/validate';
import { verifyToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set. Server cannot start.');

const CRA_EMAIL_DOMAIN = 'cra.go.ke';
const EMPLOYEE_DEFAULT_PASSWORD = 'employee123';

// In-memory rate limiter: max N attempts per IP per window.
// In production you would use Redis so limits survive server restarts
// and work across multiple server instances.
function checkRateLimit(store: Map<string, { count: number; resetAt: number }>, ip: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const record = store.get(ip);

  if (!record || now > record.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }
  if (record.count >= max) return false; // blocked
  record.count++;
  return true; // allowed
}

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const requestAccessAttempts = new Map<string, { count: number; resetAt: number }>();

// HTTP POST: Login Session Activation
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(loginAttempts, ip, 10, 15 * 60 * 1000)) {
    return res.status(429).json({ message: 'Too many login attempts. Please try again in 15 minutes.' });
  }

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password fields are required' });
  }

  const emailError = requireEmail('email', email);
  if (emailError) {
    return res.status(400).json({ message: emailError.message });
  }

  try {
    // 1. Query user record
    const user: any = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid dispatch credentials' });
    }

    // 2. Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid dispatch credentials' });
    }

    // 2b. Employee accounts must be approved by an admin/dispatcher before they can log in
    if (user.accountStatus === 'pending') {
      return res.status(403).json({ message: 'Your account request is still awaiting admin approval.' });
    }
    if (user.accountStatus === 'rejected') {
      return res.status(403).json({ message: `Your account request was rejected. Reason: ${user.rejectionReason || 'not specified'}` });
    }

    // 3. Issue Authorization JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword ?? false,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// HTTP POST: CRA employee access request — public, no auto-login
router.post('/request-access', async (req: Request, res: Response) => {
  const { name, email, department, employeeId } = req.body;

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(requestAccessAttempts, ip, 5, 60 * 60 * 1000)) {
    return res.status(429).json({ message: 'Too many access requests from this network. Please try again later.' });
  }

  const errors = collectErrors(
    requireFields(req.body, ['name', 'email', 'department', 'employeeId']),
    requireEmail('email', email),
    requireEmailDomain('email', email, CRA_EMAIL_DOMAIN),
  );
  if (errors.length) {
    return res.status(400).json({ message: errors[0].message, errors });
  }

  try {
    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'An account request with this email already exists.' });
    }

    const user = new User({
      name,
      email,
      department,
      employeeId,
      password: EMPLOYEE_DEFAULT_PASSWORD,
      role: 'employee',
      accountStatus: 'pending',
    });
    await user.save();

    return res.status(201).json({
      message: `Request submitted. An admin or dispatcher will review it — once approved, log in with your CRA email and the password ${EMPLOYEE_DEFAULT_PASSWORD}.`,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account request with this email already exists.' });
    }
    console.error('Request access error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// HTTP POST: Driver self-service password change — any authenticated user
router.post('/change-password', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters.' });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ message: 'New password must be different from your current password.' });
  }

  try {
    const user: any = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ message: 'User account not found.' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    // Assign plain text — the pre-save hook in User.ts hashes it automatically
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    return res.json({ message: 'Password updated successfully.' });
  } catch (error: any) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
