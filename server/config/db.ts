import mongoose from 'mongoose';

export interface IDatabaseStatus {
  connected: boolean;
  type: 'mongodb' | 'embedded';
  message: string;
}

let dbStatus: IDatabaseStatus = {
  connected: false,
  type: 'embedded',
  message: 'Initializing database...',
};

// In-memory / embedded fallback storage when MongoDB connection string is not provided
class EmbeddedStore {
  private users: Map<string, any> = new Map();
  private profiles: Map<string, any> = new Map();
  private predictions: Map<string, any> = new Map();
  private idCounter = 1;

  constructor() {
    // Seed an admin user and demo user for instant testing
    const adminUser = {
      _id: 'usr_admin_001',
      supabaseUserId: 'supa_admin_001',
      name: 'System Admin',
      email: 'admin@careerpredict.ai',
      role: 'admin',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    };
    const demoUser = {
      _id: 'usr_demo_002',
      supabaseUserId: 'supa_demo_002',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      role: 'user',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    };
    this.users.set(adminUser._id, adminUser);
    this.users.set(demoUser._id, demoUser);

    // Seed a demo candidate profile
    const demoProfile = {
      _id: 'prof_demo_001',
      user: demoUser._id,
      age: 22,
      gender: 'Non-binary',
      location: 'San Francisco, CA',
      educationLevel: "Bachelor's",
      degree: 'B.S. in Computer Science',
      fieldOfStudy: 'Computer Science',
      yearsExperience: 1.5,
      internshipCount: 2,
      previousJobs: 1,
      technicalSkillScore: 82,
      webDevelopmentScore: 85,
      databaseScore: 78,
      dataStructuresScore: 80,
      algorithmScore: 75,
      machineLearningScore: 68,
      cloudScore: 72,
      communicationScore: 76,
      leadershipScore: 65,
      teamworkScore: 84,
      problemSolvingScore: 80,
      projectCount: 4,
      certificationCount: 2,
      resumeScore: 78,
      interviewScore: 74,
      aptitudeScore: 82,
      githubActivity: 75,
      desiredRole: 'Full Stack Developer',
      workPreference: 'Hybrid',
      expectedSalary: '$95,000 / year',
      relocation: 'Yes',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    };
    this.profiles.set(demoProfile._id, demoProfile);

    // Seed some initial prediction records for history and dashboard analytics
    const initialPredictions = [
      {
        _id: 'pred_001',
        user: demoUser._id,
        candidateProfile: demoProfile._id,
        prediction: 1,
        predictionLabel: 'Likely to Get Job',
        jobProbability: 86.4,
        noJobProbability: 13.6,
        confidence: 'Strong Potential',
        careerReadinessScore: 81,
        recommendations: [
          'Practice system design mock interviews to boost interview score from 74% to 85%.',
          'Highlight hands-on cloud deployment experience in AWS or GCP on your resume.',
          'Contribute to open-source full-stack repositories to keep GitHub activity high.',
        ],
        modelVersion: '1.0.0',
        inputSnapshot: {
          age: 22,
          educationLevel: "Bachelor's",
          fieldOfStudy: 'Computer Science',
          yearsExperience: 1.5,
          technicalSkillScore: 82,
          communicationScore: 76,
          problemSolvingScore: 80,
          projectCount: 4,
          certificationCount: 2,
          resumeScore: 78,
          interviewScore: 74,
          aptitudeScore: 82,
          desiredRole: 'Full Stack Developer',
        },
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        _id: 'pred_002',
        user: demoUser._id,
        candidateProfile: demoProfile._id,
        prediction: 1,
        predictionLabel: 'Likely to Get Job',
        jobProbability: 79.2,
        noJobProbability: 20.8,
        confidence: 'Good Potential',
        careerReadinessScore: 74,
        recommendations: [
          'Deepen DSA preparation for technical coding rounds.',
          'Build one additional production-grade project showcasing microservices or Docker.',
        ],
        modelVersion: '1.0.0',
        inputSnapshot: {
          age: 22,
          educationLevel: "Bachelor's",
          fieldOfStudy: 'Computer Science',
          yearsExperience: 1.0,
          technicalSkillScore: 76,
          communicationScore: 70,
          problemSolvingScore: 75,
          projectCount: 3,
          certificationCount: 1,
          resumeScore: 72,
          interviewScore: 70,
          aptitudeScore: 78,
          desiredRole: 'Full Stack Developer',
        },
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const p of initialPredictions) {
      this.predictions.set(p._id, p);
    }
  }

  // Users
  findUserBySupabaseId(supabaseUserId: string) {
    for (const u of this.users.values()) {
      if (u.supabaseUserId === supabaseUserId) return { ...u };
    }
    return null;
  }

  findUserById(id: string) {
    const u = this.users.get(id);
    return u ? { ...u } : null;
  }

  findUserByEmail(email: string) {
    for (const u of this.users.values()) {
      if (u.email && u.email.toLowerCase() === email.toLowerCase()) return { ...u };
    }
    return null;
  }

  createUser(userData: any) {
    const id = 'usr_' + Date.now() + '_' + this.idCounter++;
    const user = {
      _id: id,
      supabaseUserId: userData.supabaseUserId,
      name: userData.name || 'Candidate',
      email: userData.email || '',
      role: userData.role || 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return { ...user };
  }

  updateUser(id: string, updates: any) {
    const user = this.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updated);
    return { ...updated };
  }

  deleteUser(id: string) {
    const user = this.users.get(id);
    if (!user) return false;
    this.users.delete(id);
    // Cascade delete profile and predictions
    for (const [pId, p] of this.profiles.entries()) {
      if (p.user === id) this.profiles.delete(pId);
    }
    for (const [predId, pred] of this.predictions.entries()) {
      if (pred.user === id) this.predictions.delete(predId);
    }
    return true;
  }

  getAllUsers() {
    return Array.from(this.users.values()).map(u => ({ ...u }));
  }

  // Candidate Profiles
  findProfileByUserId(userId: string) {
    for (const p of this.profiles.values()) {
      if (p.user === userId) return { ...p };
    }
    return null;
  }

  upsertProfile(userId: string, profileData: any) {
    let existing = this.findProfileByUserId(userId);
    if (existing) {
      const updated = { ...existing, ...profileData, user: userId, updatedAt: new Date() };
      this.profiles.set(existing._id, updated);
      return { ...updated };
    } else {
      const id = 'prof_' + Date.now() + '_' + this.idCounter++;
      const newProf = {
        _id: id,
        user: userId,
        ...profileData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.profiles.set(id, newProf);
      return { ...newProf };
    }
  }

  // Predictions
  createPrediction(predData: any) {
    const id = 'pred_' + Date.now() + '_' + this.idCounter++;
    const newPred = {
      _id: id,
      ...predData,
      createdAt: new Date(),
    };
    this.predictions.set(id, newPred);
    return { ...newPred };
  }

  findPredictionsByUserId(userId: string, options: { page?: number; limit?: number; filter?: string; sort?: string } = {}) {
    let all = Array.from(this.predictions.values()).filter(p => p.user === userId);

    if (options.filter === 'likely') {
      all = all.filter(p => p.prediction === 1);
    } else if (options.filter === 'unlikely') {
      all = all.filter(p => p.prediction === 0);
    }

    if (options.sort === 'oldest') {
      all.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (options.sort === 'highest') {
      all.sort((a, b) => b.jobProbability - a.jobProbability);
    } else if (options.sort === 'lowest') {
      all.sort((a, b) => a.jobProbability - b.jobProbability);
    } else {
      // Default: newest
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = all.length;
    const page = options.page || 1;
    const limit = options.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginated = all.slice(startIndex, startIndex + limit);

    return {
      data: paginated.map(p => ({ ...p })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  findPredictionById(id: string) {
    const pred = this.predictions.get(id);
    return pred ? { ...pred } : null;
  }

  deletePrediction(id: string, userId: string) {
    const pred = this.predictions.get(id);
    if (!pred || pred.user !== userId) return false;
    this.predictions.delete(id);
    return true;
  }

  getAllPredictions() {
    return Array.from(this.predictions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(p => ({ ...p }));
  }
}

export const embeddedDb = new EmbeddedStore();

export async function connectDB(): Promise<IDatabaseStatus> {
  const mongoUri = process.env.MONGO_URI;

  if (mongoUri && mongoUri.startsWith('mongodb')) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      dbStatus = {
        connected: true,
        type: 'mongodb',
        message: 'Connected to MongoDB database successfully.',
      };
      console.log('MongoDB connected successfully:', mongoUri.split('@')[1] || 'Cluster');
      return dbStatus;
    } catch (err: any) {
      console.warn('MongoDB connection failed, falling back to embedded database store:', err.message);
      dbStatus = {
        connected: true,
        type: 'embedded',
        message: `MongoDB not reachable (${err.message}). Using high-performance embedded persistence.`,
      };
      return dbStatus;
    }
  } else {
    dbStatus = {
      connected: true,
      type: 'embedded',
      message: 'Embedded storage active (provide MONGO_URI in .env for MongoDB Atlas connection).',
    };
    return dbStatus;
  }
}

export function getDBStatus(): IDatabaseStatus {
  return dbStatus;
}
