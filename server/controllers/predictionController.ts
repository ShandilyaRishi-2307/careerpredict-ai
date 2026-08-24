import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { PredictionService } from '../services/predictionService.js';
import { ModelService } from '../services/modelService.js';
import { validatePredictionInput } from '../utils/validation.js';

export class PredictionController {
  /**
   * POST /api/predictions
   */
  public static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!._id;
      const inputData = req.body || {};

      // Server-side validation
      const validation = validatePredictionInput(inputData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.errors[0] || 'Invalid candidate feature input',
          errors: validation.errors,
        });
      }

      const result = await PredictionService.createPrediction(userId, inputData);

      return res.status(201).json({
        success: true,
        message: 'Prediction successfully generated using Logistic Regression model.',
        data: result,
      });
    } catch (err: any) {
      console.error('Prediction creation error:', err);
      return res.status(500).json({
        success: false,
        message: 'We could not complete your prediction right now. Please try again later.',
      });
    }
  }

  /**
   * GET /api/predictions
   */
  public static async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!._id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filter = (req.query.filter as string) || 'all';
      const sort = (req.query.sort as string) || 'newest';

      const results = await PredictionService.getUserPredictions(userId, {
        page,
        limit,
        filter,
        sort,
      });

      return res.status(200).json({
        success: true,
        ...results,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/predictions/stats/summary
   */
  public static async getSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!._id;
      const allPreds = await PredictionService.getUserPredictions(userId, { page: 1, limit: 100 });
      const data = allPreds.data || [];

      if (data.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            totalPredictions: 0,
            latestPrediction: null,
            averageProbability: 0,
            probabilityDelta: 0,
            strongestSkill: 'Not assessed yet',
            weakestSkill: 'Not assessed yet',
          },
        });
      }

      const latest = data[0];
      const previous = data[1] || null;

      const sumProb = data.reduce((acc: number, p: any) => acc + (p.jobProbability || 0), 0);
      const avgProb = Math.round((sumProb / data.length) * 10) / 10;

      const probDelta = previous
        ? Math.round((latest.jobProbability - previous.jobProbability) * 10) / 10
        : 0;

      // Extract skills from latest snapshot
      const snap = latest.inputSnapshot || {};
      const skills = [
        { name: 'Technical Skills', val: snap.technicalSkillScore || 50 },
        { name: 'Problem Solving', val: snap.problemSolvingScore || 50 },
        { name: 'Communication', val: snap.communicationScore || 50 },
        { name: 'Interview Performance', val: snap.interviewScore || 50 },
        { name: 'Resume Quality', val: snap.resumeScore || 50 },
        { name: 'Aptitude', val: snap.aptitudeScore || 50 },
      ];

      skills.sort((a, b) => b.val - a.val);
      const strongestSkill = `${skills[0].name} (${skills[0].val}%)`;
      const weakestSkill = `${skills[skills.length - 1].name} (${skills[skills.length - 1].val}%)`;

      return res.status(200).json({
        success: true,
        data: {
          totalPredictions: data.length,
          latestPrediction: latest,
          averageProbability: avgProb,
          probabilityDelta: probDelta,
          strongestSkill,
          weakestSkill,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/predictions/:id
   */
  public static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!._id;
      const id = req.params.id;

      const prediction = await PredictionService.getPredictionById(id, userId);
      if (!prediction) {
        return res.status(404).json({
          success: false,
          message: 'Prediction record not found or unauthorized access.',
        });
      }

      return res.status(200).json({
        success: true,
        data: prediction,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * DELETE /api/predictions/:id
   */
  public static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!._id;
      const id = req.params.id;

      const deleted = await PredictionService.deletePrediction(id, userId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Prediction record not found or already deleted.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Prediction record deleted successfully.',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
