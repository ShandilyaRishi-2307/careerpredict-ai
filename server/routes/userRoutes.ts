import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All user routes require authentication
router.use(authMiddleware as any);

router.get('/profile', UserController.getProfile as any);
router.put('/profile', UserController.updateProfile as any);
router.delete('/account', UserController.deleteAccount as any);

export default router;
