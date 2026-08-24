import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware.js';

export function adminMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden. Administrator privileges are required to access this resource.',
    });
  }

  next();
}
