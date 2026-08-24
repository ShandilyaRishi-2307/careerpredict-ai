import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export class AuthController {
  public static async getMe(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: req.user._id,
        supabaseUserId: req.user.supabaseUserId,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  }
}
