import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { embeddedDb } from '../config/db.js';
import { UserModel } from '../models/User.js';
import { PredictionModel } from '../models/Prediction.js';
import { ModelService } from '../services/modelService.js';

export class AdminController {
  /**
   * GET /api/admin/stats
   */
  public static async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      let usersCount = 0;
      let predictions: any[] = [];

      if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb')) {
        usersCount = await UserModel.countDocuments();
        predictions = await PredictionModel.find().lean();
      } else {
        usersCount = embeddedDb.getAllUsers().length;
        predictions = embeddedDb.getAllPredictions();
      }

      const totalPredictions = predictions.length;
      const positivePredictions = predictions.filter(p => p.prediction === 1).length;
      const negativePredictions = totalPredictions - positivePredictions;

      const sumProb = predictions.reduce((acc, p) => acc + (p.jobProbability || 0), 0);
      const avgProbability = totalPredictions > 0 ? Math.round((sumProb / totalPredictions) * 10) / 10 : 0;

      // Probability distribution buckets
      const distribution = {
        needsImprovement: predictions.filter(p => p.jobProbability < 40).length,
        moderate: predictions.filter(p => p.jobProbability >= 40 && p.jobProbability < 60).length,
        good: predictions.filter(p => p.jobProbability >= 60 && p.jobProbability < 80).length,
        strong: predictions.filter(p => p.jobProbability >= 80).length,
      };

      const metadata = ModelService.getModelMetadata();

      return res.status(200).json({
        success: true,
        data: {
          totalUsers: usersCount,
          totalPredictions,
          positivePredictions,
          negativePredictions,
          averageProbability: avgProbability,
          distribution,
          modelMetadata: metadata,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/admin/users
   */
  public static async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      let users: any[] = [];
      let predictions: any[] = [];

      if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb')) {
        users = await UserModel.find().select('-__v').sort({ createdAt: -1 }).lean();
        predictions = await PredictionModel.find().select('user').lean();
      } else {
        users = embeddedDb.getAllUsers();
        predictions = embeddedDb.getAllPredictions();
      }

      const userPredCounts: Record<string, number> = {};
      for (const p of predictions) {
        const uId = String(p.user);
        userPredCounts[uId] = (userPredCounts[uId] || 0) + 1;
      }

      const safeUsers = users.map(u => ({
        _id: u._id,
        supabaseUserId: u.supabaseUserId,
        name: u.name,
        email: u.email,
        role: u.role,
        predictionCount: userPredCounts[String(u._id)] || 0,
        createdAt: u.createdAt,
      }));

      return res.status(200).json({
        success: true,
        data: safeUsers,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/admin/predictions
   */
  public static async getPredictions(req: AuthenticatedRequest, res: Response) {
    try {
      let predictions: any[] = [];

      if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb')) {
        predictions = await PredictionModel.find()
          .populate('user', 'name email')
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
      } else {
        predictions = embeddedDb.getAllPredictions().slice(0, 50);
      }

      return res.status(200).json({
        success: true,
        data: predictions,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
