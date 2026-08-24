export interface IRecommendationResult {
  careerReadinessScore: number;
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
  roleGaps: {
    targetRole: string;
    strongAreas: string[];
    improvementAreas: string[];
  };
}

export class RecommendationService {
  public static generate(profile: Record<string, any>): IRecommendationResult {
    const tech = Number(profile.technicalSkillScore || profile.technical_skill_score || 50);
    const comm = Number(profile.communicationScore || profile.communication_score || 50);
    const prob = Number(profile.problemSolvingScore || profile.problem_solving_score || 50);
    const leader = Number(profile.leadershipScore || profile.leadership_score || 50);
    const team = Number(profile.teamworkScore || profile.teamwork_score || 50);
    const interview = Number(profile.interviewScore || profile.interview_score || 50);
    const resume = Number(profile.resumeScore || profile.resume_score || 50);
    const projects = Number(profile.projectCount || profile.project_count || 0);
    const certs = Number(profile.certificationCount || profile.certification_count || 0);
    const exp = Number(profile.yearsExperience || profile.years_experience || 0);
    const internships = Number(profile.internshipCount || profile.internship_count || 0);
    const github = Number(profile.githubActivity || profile.github_activity || 50);
    const role = (profile.desiredRole || profile.desired_role || 'Software Developer').trim();

    // 1. Calculate Career Readiness Score (0-100)
    // Distinct from ML job probability: Readiness is a composite benchmark score
    const readinessScore = Math.round(
      0.25 * tech +
      0.15 * prob +
      0.15 * interview +
      0.12 * resume +
      0.10 * comm +
      0.08 * team +
      Math.min(10, projects * 2.5) +
      Math.min(5, certs * 1.5)
    );
    const careerReadinessScore = Math.min(100, Math.max(10, readinessScore));

    const recommendations: string[] = [];
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Evaluate technical skills
    if (tech >= 75) {
      strengths.push('Strong technical skill foundation across core computer science competencies.');
    } else if (tech < 60) {
      weaknesses.push('Technical skill score is below competitive placement threshold (60%).');
      recommendations.push('Improve technical skills through practical hands-on coding, building full-stack applications, and mastering core frameworks.');
    }

    // Problem solving & DSA
    if (prob >= 75) {
      strengths.push('Excellent analytical and algorithmic problem-solving capabilities.');
    } else if (prob < 60) {
      weaknesses.push('Problem-solving & Data Structures/Algorithms score requires improvement.');
      recommendations.push('Practice daily Data Structures & Algorithms (DSA) problems on LeetCode/HackerRank focusing on Arrays, Trees, Graphs, and Dynamic Programming.');
    }

    // Communication
    if (comm >= 75) {
      strengths.push('Articulate communication and professional presentation skills.');
    } else if (comm < 60) {
      weaknesses.push('Communication score could hinder behavioral and HR interview rounds.');
      recommendations.push('Practice behavioral communication using the STAR method (Situation, Task, Action, Result) for interview scenarios.');
    }

    // Interview Performance
    if (interview >= 75) {
      strengths.push('Demonstrates high confidence and composure in interview simulations.');
    } else if (interview < 60) {
      weaknesses.push('Interview performance score indicates potential anxiety or lack of structured answers.');
      recommendations.push('Conduct weekly peer mock interviews and record practice technical explanations on platforms like Pramp or Interviewing.io.');
    }

    // Resume Score
    if (resume >= 75) {
      strengths.push('High-impact resume with quantified achievements and clear formatting.');
    } else if (resume < 60) {
      weaknesses.push('Resume formatting or keyword optimization needs refinement.');
      recommendations.push('Revamp your resume using the Harvard/Jalapeno standard template; quantify impact with metrics (e.g., "reduced latency by 35%").');
    }

    // Projects
    if (projects >= 4) {
      strengths.push('Robust portfolio showcasing multiple full-scale end-to-end applications.');
    } else if (projects < 2) {
      weaknesses.push('Limited portfolio depth; fewer than 2 completed practical projects.');
      recommendations.push('Build at least 2 distinct production-ready projects featuring full-stack CRUD, API integrations, authentication, and live Cloud deployment.');
    }

    // GitHub & Open Source
    if (github < 40) {
      recommendations.push('Enhance GitHub activity by pushing regular commit streaks, writing detailed README documentation, and pinning top repositories.');
    }

    // Certifications & Cloud
    if (certs === 0) {
      recommendations.push('Consider pursuing industry-standard cloud certifications (such as AWS Certified Cloud Practitioner/Solutions Architect or GCP Associate Cloud Engineer).');
    }

    // Fallback recommendation if profile is exceptional
    if (recommendations.length === 0) {
      recommendations.push('Maintain consistent coding habits and begin networking with engineering leads on LinkedIn.');
      recommendations.push('Prepare for system design architecture interviews (caching, load balancing, database sharding).');
    }

    // Role-specific gaps
    const roleGaps = RecommendationService.getRoleSpecificGaps(role, { tech, prob, comm, projects });

    return {
      careerReadinessScore,
      recommendations,
      strengths: strengths.length ? strengths : ['Shows steady engagement and basic foundational training.'],
      weaknesses: weaknesses.length ? weaknesses : ['Overall profile is balanced across major domains.'],
      roleGaps,
    };
  }

  private static getRoleSpecificGaps(role: string, scores: { tech: number; prob: number; comm: number; projects: number }) {
    const normalizedRole = role.toLowerCase();

    if (normalizedRole.includes('backend')) {
      return {
        targetRole: 'Backend Developer',
        strongAreas: ['REST APIs', 'Node.js/Express', 'Relational Databases', 'Server Architecture'],
        improvementAreas: ['Distributed Systems', 'Message Queues (Kafka/RabbitMQ)', 'Docker/Kubernetes', 'Database Optimization'],
      };
    } else if (normalizedRole.includes('frontend')) {
      return {
        targetRole: 'Frontend Developer',
        strongAreas: ['HTML5 & CSS3', 'JavaScript/TypeScript', 'Component Architecture', 'Responsive UI'],
        improvementAreas: ['State Management (Redux/Zustand)', 'Web Performance & Core Web Vitals', 'Accessibility (WCAG)', 'End-to-End Testing'],
      };
    } else if (normalizedRole.includes('machine learning') || normalizedRole.includes('data')) {
      return {
        targetRole: 'Machine Learning / Data Engineer',
        strongAreas: ['Python', 'Data Preprocessing', 'Scikit-learn', 'Model Evaluation'],
        improvementAreas: ['Deep Learning Frameworks (PyTorch/TensorFlow)', 'MLOps & Pipeline Deployment', 'Feature Stores', 'Big Data (Spark/SQL)'],
      };
    } else if (normalizedRole.includes('devops') || normalizedRole.includes('cloud')) {
      return {
        targetRole: 'DevOps / Cloud Engineer',
        strongAreas: ['Linux Shell', 'Cloud Infrastructure', 'CI/CD Pipelines'],
        improvementAreas: ['Terraform (IaC)', 'Kubernetes Cluster Administration', 'Observability (Prometheus/Grafana)', 'Security & Compliance'],
      };
    }

    return {
      targetRole: 'Software Developer',
      strongAreas: ['Object-Oriented Programming', 'Full-Stack Basics', 'Git Version Control'],
      improvementAreas: ['System Design Fundamentals', 'Automated Unit & Integration Testing', 'Clean Code Principles', 'Agile Methodology'],
    };
  }
}
