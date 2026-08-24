import { Router } from 'express';
import { PredictionController } from '../controllers/predictionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all prediction routes
router.use(authMiddleware as any);

router.post('/', PredictionController.create as any);
router.get('/', PredictionController.getAll as any);
router.get('/stats/summary', PredictionController.getSummary as any);
router.get('/:id', PredictionController.getById as any);
router.delete('/:id', PredictionController.delete as any);

export default router;
