import { Request, Response, NextFunction } from 'express';
import { verifySupabaseToken } from '../config/supabase.js';
import { embeddedDb } from '../config/db.js';
import { UserModel } from '../models/User.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    supabaseUserId: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
  };
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid Supabase bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];
    const supabaseUser = await verifySupabaseToken(token);

    if (!supabaseUser || !supabaseUser.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication session. Please log in again.',
      });
    }

    // Sync or retrieve user from database
    let dbUser: any = null;

    if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb')) {
      dbUser = await UserModel.findOne({ supabaseUserId: supabaseUser.id });
      if (!dbUser) {
        // First-time sync
        const displayName =
          supabaseUser.user_metadata?.full_name ||
          supabaseUser.user_metadata?.name ||
          supabaseUser.email.split('@')[0] ||
          'Candidate';

        dbUser = await UserModel.create({
          supabaseUserId: supabaseUser.id,
          name: displayName,
          email: supabaseUser.email,
          role: 'user',
        });
      }
    } else {
      dbUser = embeddedDb.findUserBySupabaseId(supabaseUser.id);
      if (!dbUser) {
        const displayName =
          supabaseUser.user_metadata?.full_name ||
          supabaseUser.user_metadata?.name ||
          supabaseUser.email.split('@')[0] ||
          'Candidate';

        dbUser = embeddedDb.createUser({
          supabaseUserId: supabaseUser.id,
          name: displayName,
          email: supabaseUser.email,
          role: 'user',
        });
      }
    }

    req.user = {
      _id: String(dbUser._id),
      supabaseUserId: dbUser.supabaseUserId,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role || 'user',
    };

    next();
  } catch (error: any) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal authentication validation error.',
    });
  }
}
