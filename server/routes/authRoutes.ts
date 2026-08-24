import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/auth/me - Retrieve current authenticated user profile
router.get('/me', authMiddleware as any, AuthController.getMe as any);

export default router;
