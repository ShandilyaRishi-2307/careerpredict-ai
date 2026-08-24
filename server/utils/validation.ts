export interface IValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePredictionInput(data: Record<string, any>): IValidationResult {
  const errors: string[] = [];

  const age = Number(data.age);
  if (isNaN(age) || age < 16 || age > 80) {
    errors.push('Age must be a valid number between 16 and 80.');
  }

  const exp = Number(data.yearsExperience ?? data.years_experience);
  if (isNaN(exp) || exp < 0 || exp > 50) {
    errors.push('Years of experience must be between 0 and 50.');
  }

  const scoreFields = [
    { key: 'technicalSkillScore', label: 'Technical skill score' },
    { key: 'communicationScore', label: 'Communication score' },
    { key: 'problemSolvingScore', label: 'Problem solving score' },
    { key: 'leadershipScore', label: 'Leadership score' },
    { key: 'teamworkScore', label: 'Teamwork score' },
    { key: 'resumeScore', label: 'Resume score' },
    { key: 'interviewScore', label: 'Interview score' },
    { key: 'aptitudeScore', label: 'Aptitude score' },
    { key: 'githubActivity', label: 'GitHub activity' },
  ];

  for (const field of scoreFields) {
    const val = data[field.key];
    if (val !== undefined) {
      const num = Number(val);
      if (isNaN(num) || num < 0 || num > 100) {
        errors.push(`${field.label} must be a number between 0 and 100.`);
      }
    }
  }

  const projectCount = Number(data.projectCount ?? data.project_count);
  if (!isNaN(projectCount) && (projectCount < 0 || projectCount > 100)) {
    errors.push('Project count must be between 0 and 100.');
  }

  const certCount = Number(data.certificationCount ?? data.certification_count);
  if (!isNaN(certCount) && (certCount < 0 || certCount > 100)) {
    errors.push('Certification count must be between 0 and 100.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
