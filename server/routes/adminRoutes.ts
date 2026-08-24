import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();

// Protect all admin routes with both Supabase Auth and MongoDB admin role check
router.use(authMiddleware as any);
router.use(adminMiddleware as any);

router.get('/stats', AdminController.getStats as any);
router.get('/users', AdminController.getUsers as any);
router.get('/predictions', AdminController.getPredictions as any);

export default router;
