import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Middleware: Verify JWT token on protected routes
export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Authorization token is invalid or has expired' });
  }
};

// Middleware: Restrict access to Fleet Manager / Dispatcher / Admin roles only
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const adminRoles = ['admin', 'dispatcher'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access restricted to Fleet Manager and Dispatcher roles' });
  }

  next();
};

/**
 * Factory: produce a middleware that allows only the specified roles.
 *
 * Usage:
 *   requireRole('admin')                 // admin-only
 *   requireRole('admin', 'dispatcher')   // same as requireAdmin, but explicit
 *
 * Why a factory instead of a fixed list: some operations (e.g. deleting vehicles,
 * enrolling drivers) create or destroy system-level records and should be
 * gated to admin only — not dispatchers. requireAdmin is kept for the common
 * "admin or dispatcher" case to avoid touching existing call sites.
 */
export const requireRole = (...allowedRoles: string[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
      return;
    }

    next();
  };
