import mongoose, { Schema, Document } from 'mongoose';

export interface ICandidateProfile extends Document {
  user: mongoose.Types.ObjectId | string;
  age: number;
  gender?: string;
  location?: string;
  educationLevel: string;
  degree?: string;
  fieldOfStudy: string;
  yearsExperience: number;
  internshipCount: number;
  previousJobs: number;
  technicalSkillScore: number;
  webDevelopmentScore: number;
  databaseScore: number;
  dataStructuresScore: number;
  algorithmScore: number;
  machineLearningScore: number;
  cloudScore: number;
  communicationScore: number;
  leadershipScore: number;
  teamworkScore: number;
  problemSolvingScore: number;
  projectCount: number;
  certificationCount: number;
  resumeScore: number;
  interviewScore: number;
  aptitudeScore: number;
  githubActivity: number;
  desiredRole: string;
  workPreference: string;
  expectedSalary: string;
  relocation: string;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateProfileSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    age: { type: Number, required: true, min: 16, max: 80, default: 22 },
    gender: { type: String, default: 'Prefer not to say' },
    location: { type: String, default: '' },
    educationLevel: {
      type: String,
      required: true,
      enum: ['Diploma', "Bachelor's", "Master's", 'PhD', 'High School', 'Other'],
      default: "Bachelor's",
    },
    degree: { type: String, default: 'B.S. in Computer Science' },
    fieldOfStudy: {
      type: String,
      required: true,
      default: 'Computer Science',
    },
    yearsExperience: { type: Number, required: true, min: 0, max: 50, default: 1 },
    internshipCount: { type: Number, min: 0, max: 20, default: 1 },
    previousJobs: { type: Number, min: 0, max: 20, default: 0 },
    technicalSkillScore: { type: Number, min: 0, max: 100, default: 75 },
    webDevelopmentScore: { type: Number, min: 0, max: 100, default: 70 },
    databaseScore: { type: Number, min: 0, max: 100, default: 70 },
    dataStructuresScore: { type: Number, min: 0, max: 100, default: 70 },
    algorithmScore: { type: Number, min: 0, max: 100, default: 70 },
    machineLearningScore: { type: Number, min: 0, max: 100, default: 60 },
    cloudScore: { type: Number, min: 0, max: 100, default: 65 },
    communicationScore: { type: Number, min: 0, max: 100, default: 75 },
    leadershipScore: { type: Number, min: 0, max: 100, default: 65 },
    teamworkScore: { type: Number, min: 0, max: 100, default: 80 },
    problemSolvingScore: { type: Number, min: 0, max: 100, default: 75 },
    projectCount: { type: Number, min: 0, max: 50, default: 3 },
    certificationCount: { type: Number, min: 0, max: 30, default: 1 },
    resumeScore: { type: Number, min: 0, max: 100, default: 75 },
    interviewScore: { type: Number, min: 0, max: 100, default: 70 },
    aptitudeScore: { type: Number, min: 0, max: 100, default: 75 },
    githubActivity: { type: Number, min: 0, max: 100, default: 70 },
    desiredRole: { type: String, default: 'Software Developer' },
    workPreference: { type: String, enum: ['Remote', 'Hybrid', 'On-site'], default: 'Hybrid' },
    expectedSalary: { type: String, default: '$85,000 / year' },
    relocation: { type: String, enum: ['Yes', 'No', 'Negotiable'], default: 'Yes' },
  },
  {
    timestamps: true,
  }
);

export const CandidateProfileModel: mongoose.Model<ICandidateProfile> =
  (mongoose.models.CandidateProfile as mongoose.Model<ICandidateProfile>) ||
  mongoose.model<ICandidateProfile>('CandidateProfile', CandidateProfileSchema);
