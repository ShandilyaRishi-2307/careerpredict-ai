import { embeddedDb } from '../config/db.js';
import { CandidateProfileModel } from '../models/CandidateProfile.js';
import { PredictionModel } from '../models/Prediction.js';
import { ModelService, IMLPredictionResult } from './modelService.js';
import { RecommendationService } from './recommendationService.js';

export class PredictionService {
  /**
   * Run full prediction workflow for an authenticated user
   */
  public static async createPrediction(userId: string, inputData: Record<string, any>) {
    // 1. Save or update candidate profile in DB
    let candidateProfileId: any = null;
    try {
      if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb')) {
        const updatedProfile = await CandidateProfileModel.findOneAndUpdate(
          { user: userId },
          { user: userId, ...inputData },
          { new: true, upsert: true }
        );
        candidateProfileId = updatedProfile._id;
      } else {
        const prof = embeddedDb.upsertProfile(userId, inputData);
        candidateProfileId = prof._id;
      }
    } catch (err) {
      console.warn('Profile persistence notice:', err);
    }

    // 2. Call Python Logistic Regression Model
    const mlResult: IMLPredictionResult = await ModelService.predict(inputData);

    // 3. Generate actionable recommendations and readiness score
    const recResult = RecommendationService.generate(inputData);

    // 4. Create immutable input snapshot
    const inputSnapshot = {
      age: inputData.age || 22,
      educationLevel: inputData.educationLevel || inputData.education_level || "Bachelor's",
      fieldOfStudy: inputData.fieldOfStudy || inputData.field_of_study || 'Computer Science',
      yearsExperience: inputData.yearsExperience ?? inputData.years_experience ?? 0,
      internshipCount: inputData.internshipCount ?? inputData.internship_count ?? 0,
      technicalSkillScore: inputData.technicalSkillScore ?? inputData.technical_skill_score ?? 50,
      communicationScore: inputData.communicationScore ?? inputData.communication_score ?? 50,
      problemSolvingScore: inputData.problemSolvingScore ?? inputData.problem_solving_score ?? 50,
      projectCount: inputData.projectCount ?? inputData.project_count ?? 0,
      certificationCount: inputData.certificationCount ?? inputData.certification_count ?? 0,
      resumeScore: inputData.resumeScore ?? inputData.resume_score ?? 50,
      interviewScore: inputData.interviewScore ?? inputData.interview_score ?? 50,
      aptitudeScore: inputData.aptitudeScore ?? inputData.aptitude_score ?? 50,
      githubActivity: inputData.githubActivity ?? inputData.github_activity ?? 50,
      desiredRole: inputData.desiredRole || inputData.desired_role || 'Software Developer',
      workPreference: inputData.workPreference || 'Hybrid',
    };

    // 5. Store prediction record in MongoDB / Embedded DB
    const predictionDoc = {
      user: userId,
      candidateProfile: candidateProfileId,
      prediction: mlResult.prediction,
      predictionLabel: mlResult.predictionLabel,
      jobProbability: mlResult.jobProbability,
      noJobProbability: mlResult.noJobProbability,
      confidence: mlResult.confidence,
      careerReadinessScore: recResult.careerReadinessScore,
      recommendations: recResult.recommendations,
      modelVersion: mlResult.modelVersion || '1.0.0',
      inputSnapshot,
    };

    let savedPrediction: any;
    if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb')) {
      savedPrediction = await PredictionModel.create(predictionDoc);
    } else {
      savedPrediction = embeddedDb.createPrediction(predictionDoc);
    }

    return {
      _id: savedPrediction._id,
      prediction: mlResult.prediction,
      predictionLabel: mlResult.predictionLabel,
      jobProbability: mlResult.jobProbability,
      noJobProbability: mlResult.noJobProbability,
      confidence: mlResult.confidence,
      careerReadinessScore: recResult.careerReadinessScore,
      recommendations: recResult.recommendations,
      strengths: recResult.strengths,
      weaknesses: recResult.weaknesses,
      roleGaps: recResult.roleGaps,
      modelVersion: mlResult.modelVersion,
      inputSnapshot,
      createdAt: savedPrediction.createdAt || new Date(),
    };
  }

  /**
   * Get paginated predictions for user
   */
  public static async getUserPredictions(
    userId: string,
    options: { page?: number; limit?: number; filter?: string; sort?: string }
  ) {
    if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb')) {
      const page = Math.max(1, Number(options.page) || 1);
      const limit = Math.max(1, Math.min(50, Number(options.limit) || 10));
      const skip = (page - 1) * limit;

      const query: any = { user: userId };
      if (options.filter === 'likely') query.prediction = 1;
      if (options.filter === 'unlikely') query.prediction = 0;

      let sortOptions: any = { createdAt: -1 };
      if (options.sort === 'oldest') sortOptions = { createdAt: 1 };
      if (options.sort === 'highest') sortOptions = { jobProbability: -1 };
      if (options.sort === 'lowest') sortOptions = { jobProbability: 1 };

      const total = await PredictionModel.countDocuments(query);
      const data = await PredictionModel.find(query).sort(sortOptions).skip(skip).limit(limit).lean();

      return {
        data,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } else {
      return embeddedDb.findPredictionsByUserId(userId, options);
    }
  }

  /**
   * Get single prediction details
   */
  public static async getPredictionById(id: string, userId: string) {
    let prediction: any = null;
    if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb')) {
      prediction = await PredictionModel.findOne({ _id: id, user: userId }).lean();
    } else {
      const p = embeddedDb.findPredictionById(id);
      if (p && p.user === userId) prediction = p;
    }

    if (!prediction) return null;

    // Recalculate rich analytical breakdowns based on snapshot
    const recResult = RecommendationService.generate(prediction.inputSnapshot || {});

    return {
      ...prediction,
      strengths: recResult.strengths,
      weaknesses: recResult.weaknesses,
      roleGaps: recResult.roleGaps,
    };
  }

  /**
   * Delete prediction
   */
  public static async deletePrediction(id: string, userId: string) {
    if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb')) {
      const res = await PredictionModel.deleteOne({ _id: id, user: userId });
      return res.deletedCount > 0;
    } else {
      return embeddedDb.deletePrediction(id, userId);
    }
  }
}
