import mongoose, { Schema, Document } from 'mongoose';

export interface IPrediction extends Document {
  user: mongoose.Types.ObjectId | string;
  candidateProfile?: mongoose.Types.ObjectId | string;
  prediction: number; // 0 or 1
  predictionLabel: string; // 'Likely to Get Job' | 'Needs Profile Improvement'
  jobProbability: number; // 0-100%
  noJobProbability: number; // 0-100%
  confidence: string; // 'Needs Improvement' | 'Moderate' | 'Good Potential' | 'Strong Potential'
  careerReadinessScore: number; // 0-100
  recommendations: string[];
  modelVersion: string;
  inputSnapshot: Record<string, any>;
  createdAt: Date;
}

const PredictionSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    candidateProfile: {
      type: Schema.Types.ObjectId,
      ref: 'CandidateProfile',
    },
    prediction: {
      type: Number,
      required: true,
      enum: [0, 1],
    },
    predictionLabel: {
      type: String,
      required: true,
    },
    jobProbability: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    noJobProbability: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    confidence: {
      type: String,
      required: true,
      enum: ['Needs Improvement', 'Moderate', 'Good Potential', 'Strong Potential'],
    },
    careerReadinessScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    recommendations: {
      type: [String],
      default: [],
    },
    modelVersion: {
      type: String,
      required: true,
      default: '1.0.0',
    },
    inputSnapshot: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for fast querying & history pagination
PredictionSchema.index({ user: 1, createdAt: -1 });

export const PredictionModel: mongoose.Model<IPrediction> =
  (mongoose.models.Prediction as mongoose.Model<IPrediction>) ||
  mongoose.model<IPrediction>('Prediction', PredictionSchema);
