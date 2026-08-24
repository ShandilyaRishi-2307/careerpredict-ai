import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { embeddedDb } from '../config/db.js';
import { CandidateProfileModel } from '../models/CandidateProfile.js';
import { UserModel } from '../models/User.js';
import { PredictionModel } from '../models/Prediction.js';
import { getSupabaseServerClient } from '../config/supabase.js';

export class UserController {
  /**
   * GET /api/users/profile
   */
  public static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!._id;
      let profile: any = null;

      if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb')) {
        profile = await CandidateProfileModel.findOne({ user: userId }).lean();
      } else {
        profile = embeddedDb.findProfileByUserId(userId);
      }

      // Calculate profile completeness score (0-100%)
      const completion = UserController.calculateProfileCompletion(profile, req.user!);

      return res.status(200).json({
        success: true,
        data: {
          user: req.user,
          profile: profile || {},
          profileCompletion: completion,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * PUT /api/users/profile
   */
  public static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!._id;
      const updates = req.body || {};

      // Optional name update
      if (updates.name && updates.name.trim()) {
        if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb')) {
          await UserModel.findByIdAndUpdate(userId, { name: updates.name.trim() });
        } else {
          embeddedDb.updateUser(userId, { name: updates.name.trim() });
        }
        req.user!.name = updates.name.trim();
      }

      let updatedProfile: any = null;
      if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb')) {
        updatedProfile = await CandidateProfileModel.findOneAndUpdate(
          { user: userId },
          { user: userId, ...updates },
          { new: true, upsert: true }
        ).lean();
      } else {
        updatedProfile = embeddedDb.upsertProfile(userId, updates);
      }

      const completion = UserController.calculateProfileCompletion(updatedProfile, req.user!);

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: {
          profile: updatedProfile,
          profileCompletion: completion,
        },
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * DELETE /api/users/account
   */
  public static async deleteAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!._id;
      const supabaseId = req.user!.supabaseUserId;

      if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb')) {
        await CandidateProfileModel.deleteMany({ user: userId });
        await PredictionModel.deleteMany({ user: userId });
        await UserModel.findByIdAndDelete(userId);
      } else {
        embeddedDb.deleteUser(userId);
      }

      // Try deleting from Supabase Auth via server client if configured
      const client = getSupabaseServerClient();
      if (client && !supabaseId.startsWith('supa_demo_')) {
        try {
          await client.auth.admin.deleteUser(supabaseId);
        } catch (supaErr) {
          console.warn('Supabase admin delete notice:', supaErr);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Account and all associated career records deleted permanently.',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  private static calculateProfileCompletion(profile: any, user: any): number {
    if (!profile) return 30; // Just user account
    let score = 20; // user account created

    if (profile.educationLevel) score += 10;
    if (profile.fieldOfStudy) score += 10;
    if (profile.yearsExperience !== undefined) score += 10;
    if (profile.technicalSkillScore !== undefined) score += 15;
    if (profile.communicationScore !== undefined) score += 10;
    if (profile.problemSolvingScore !== undefined) score += 10;
    if (profile.projectCount > 0) score += 10;
    if (profile.resumeScore !== undefined) score += 5;

    return Math.min(100, score);
  }
}
