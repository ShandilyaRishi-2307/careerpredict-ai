/**
 * CareerPredict AI — 5-Step Prediction Wizard Controller
 */

let currentStep = 1;
const totalSteps = 5;

document.addEventListener('DOMContentLoaded', async () => {
  const session = await window.requireAuth();
  if (!session) return;

  initSliders();
  initWizardNavigation();
  await prefillProfileData();
  initFormSubmission();
});

function initSliders() {
  const sliders = document.querySelectorAll('input[type="range"]');
  sliders.forEach(slider => {
    const valueDisplay = document.getElementById(`${slider.id}-val`);
    if (valueDisplay) {
      valueDisplay.textContent = slider.value + (slider.dataset.unit || '%');
      slider.addEventListener('input', () => {
        valueDisplay.textContent = slider.value + (slider.dataset.unit || '%');
      });
    }
  });
}

function initWizardNavigation() {
  const prevBtn = document.getElementById('wizard-prev-btn');
  const nextBtn = document.getElementById('wizard-next-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        goToStep(currentStep - 1);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (validateStep(currentStep)) {
        if (currentStep < totalSteps) {
          goToStep(currentStep + 1);
        }
      }
    });
  }

  // Step indicator nodes
  document.querySelectorAll('.step-node').forEach(node => {
    node.addEventListener('click', () => {
      const targetStep = parseInt(node.dataset.step);
      if (targetStep < currentStep || validateStep(currentStep)) {
        goToStep(targetStep);
      }
    });
  });
}

function goToStep(step) {
  currentStep = step;

  // Toggle step sections
  document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
  const activeStepSection = document.getElementById(`step-section-${step}`);
  if (activeStepSection) activeStepSection.classList.add('active');

  // Update step indicator bar
  document.querySelectorAll('.step-node').forEach(node => {
    const s = parseInt(node.dataset.step);
    node.classList.remove('active', 'completed');
    if (s === currentStep) {
      node.classList.add('active');
    } else if (s < currentStep) {
      node.classList.add('completed');
    }
  });

  const activeLine = document.querySelector('.step-progress-active-line');
  if (activeLine) {
    const percent = ((currentStep - 1) / (totalSteps - 1)) * 100;
    activeLine.style.width = `calc(${percent}% - 60px)`;
  }

  // Update footer buttons
  const prevBtn = document.getElementById('wizard-prev-btn');
  const nextBtn = document.getElementById('wizard-next-btn');
  const submitBtn = document.getElementById('wizard-submit-btn');

  if (prevBtn) prevBtn.style.display = currentStep === 1 ? 'none' : 'inline-flex';
  if (nextBtn) nextBtn.style.display = currentStep === totalSteps ? 'none' : 'inline-flex';
  if (submitBtn) submitBtn.style.display = currentStep === totalSteps ? 'inline-flex' : 'none';

  // Scroll to top of card smoothly
  document.querySelector('.wizard-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getElVal(id, defaultVal = '') {
  const el = document.getElementById(id);
  return el ? el.value : defaultVal;
}

function getElNum(id, defaultVal = 0) {
  const el = document.getElementById(id);
  if (!el) return defaultVal;
  const val = parseFloat(el.value);
  return isNaN(val) ? defaultVal : val;
}

function setElVal(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined && val !== null) {
    el.value = val;
  }
}

function validateStep(step) {
  if (step === 1) {
    const age = getElNum('input-age', 0);
    if (isNaN(age) || age < 16 || age > 80) {
      window.showToast('Please enter a valid age between 16 and 80.', 'error');
      return false;
    }
  } else if (step === 2) {
    const edu = getElVal('input-education');
    const field = getElVal('input-field');
    if (!edu || !field) {
      window.showToast('Please specify your education level and field of study.', 'error');
      return false;
    }
  }
  return true;
}

async function prefillProfileData() {
  try {
    const res = await window.api.get('/users/profile');
    if (res.success && res.data.profile) {
      const p = res.data.profile;

      // Personal & Education
      if (p.age) setElVal('input-age', p.age);
      if (p.gender) setElVal('input-gender', p.gender);
      if (p.location) setElVal('input-location', p.location);
      if (p.educationLevel) setElVal('input-education', p.educationLevel);
      if (p.fieldOfStudy) setElVal('input-field', p.fieldOfStudy);
      if (p.degree) setElVal('input-degree', p.degree);

      // Experience
      if (p.yearsExperience !== undefined) setElVal('input-experience', p.yearsExperience);
      if (p.internshipCount !== undefined) setElVal('input-internships', p.internshipCount);
      if (p.previousJobs !== undefined) setElVal('input-previous-jobs', p.previousJobs);

      // Skills Sliders
      const sliderIds = [
        'technicalSkillScore', 'webDevelopmentScore', 'databaseScore',
        'dataStructuresScore', 'algorithmScore', 'machineLearningScore',
        'cloudScore', 'communicationScore', 'leadershipScore',
        'teamworkScore', 'problemSolvingScore', 'resumeScore',
        'interviewScore', 'aptitudeScore', 'githubActivity'
      ];

      sliderIds.forEach(id => {
        const el = document.getElementById(`input-${id}`);
        if (el && p[id] !== undefined) {
          el.value = p[id];
          const valEl = document.getElementById(`input-${id}-val`);
          if (valEl) valEl.textContent = p[id] + '%';
        }
      });

      if (p.projectCount !== undefined) setElVal('input-projects', p.projectCount);
      if (p.certificationCount !== undefined) setElVal('input-certifications', p.certificationCount);

      // Preferences
      if (p.desiredRole) setElVal('input-desired-role', p.desiredRole);
      if (p.workPreference) setElVal('input-work-pref', p.workPreference);
      if (p.expectedSalary) setElVal('input-salary', p.expectedSalary);
      if (p.relocation) setElVal('input-relocation', p.relocation);
    }
  } catch (err) {
    console.warn('Could not auto-fill profile data:', err);
  }
}

function collectFormData() {
  return {
    age: getElNum('input-age', 22),
    gender: getElVal('input-gender', 'Male'),
    location: getElVal('input-location', 'San Francisco, CA').trim(),
    educationLevel: getElVal('input-education', "Bachelor's"),
    degree: getElVal('input-degree', 'B.S. in Computer Science').trim(),
    fieldOfStudy: getElVal('input-field', 'Computer Science'),
    
    yearsExperience: getElNum('input-experience', 0),
    internshipCount: getElNum('input-internships', 0),
    previousJobs: getElNum('input-previous-jobs', 0),

    technicalSkillScore: getElNum('input-technicalSkillScore', 50),
    webDevelopmentScore: getElNum('input-webDevelopmentScore', 50),
    databaseScore: getElNum('input-databaseScore', 50),
    dataStructuresScore: getElNum('input-dataStructuresScore', 50),
    algorithmScore: getElNum('input-algorithmScore', 50),
    machineLearningScore: getElNum('input-machineLearningScore', 50),
    cloudScore: getElNum('input-cloudScore', 50),

    communicationScore: getElNum('input-communicationScore', 50),
    leadershipScore: getElNum('input-leadershipScore', 50),
    teamworkScore: getElNum('input-teamworkScore', 50),
    problemSolvingScore: getElNum('input-problemSolvingScore', 50),

    projectCount: getElNum('input-projects', 0),
    certificationCount: getElNum('input-certifications', 0),
    resumeScore: getElNum('input-resumeScore', 50),
    interviewScore: getElNum('input-interviewScore', 50),
    aptitudeScore: getElNum('input-aptitudeScore', 50),
    githubActivity: getElNum('input-githubActivity', 50),

    desiredRole: getElVal('input-desired-role', 'Software Developer'),
    workPreference: getElVal('input-work-pref', 'Hybrid'),
    expectedSalary: getElVal('input-salary', '$95,000').trim(),
    relocation: getElVal('input-relocation', 'Yes'),
  };
}

function initFormSubmission() {
  const form = document.getElementById('prediction-form');
  const submitBtn = document.getElementById('wizard-submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateStep(currentStep)) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Running Logistic Regression ML Model...';

    const formData = collectFormData();

    try {
      const response = await window.api.post('/predictions', formData);

      if (response.success && response.data) {
        window.showToast('Prediction successfully generated!', 'success');
        renderPredictionResult(response.data, formData);
      } else {
        throw new Error(response.message || 'Prediction failed');
      }
    } catch (err) {
      window.showToast(err.message || 'We could not complete your prediction right now. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '⚡ Predict My Job Probability';
    }
  });

  // Try Again button
  const tryAgainBtn = document.getElementById('result-try-again-btn');
  if (tryAgainBtn) {
    tryAgainBtn.addEventListener('click', () => {
      document.getElementById('prediction-wizard-container').style.display = 'block';
      document.getElementById('prediction-result-container').classList.remove('active');
      goToStep(1);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '⚡ Predict My Job Probability';
    });
  }
}

function renderPredictionResult(data, inputData) {
  document.getElementById('prediction-wizard-container').style.display = 'none';
  const resultContainer = document.getElementById('prediction-result-container');
  resultContainer.classList.add('active');

  // Probability Numbers
  document.getElementById('res-job-prob').textContent = `${data.jobProbability}%`;
  document.getElementById('res-no-job-prob').textContent = `${data.noJobProbability}%`;
  document.getElementById('res-pred-label').textContent = data.predictionLabel;
  document.getElementById('res-confidence-badge').textContent = data.confidence;
  document.getElementById('res-readiness-score').textContent = `${data.careerReadinessScore}/100`;

  // History link button
  document.getElementById('res-view-details-btn').href = `/prediction-details.html?id=${data._id}`;

  // Recommendations
  const recsContainer = document.getElementById('res-recommendations-list');
  recsContainer.innerHTML = (data.recommendations || []).map((rec, i) => `
    <div class="rec-item">
      <span class="rec-bullet">${i + 1}</span>
      <p style="margin:0; font-size:0.925rem; color:var(--text-main); font-weight:500;">${rec}</p>
    </div>
  `).join('');

  // Skill Bars
  const skills = [
    { label: 'Technical Skills', val: inputData.technicalSkillScore },
    { label: 'Problem Solving & DSA', val: inputData.problemSolvingScore },
    { label: 'Communication Skills', val: inputData.communicationScore },
    { label: 'Interview Composure', val: inputData.interviewScore },
    { label: 'Resume & Portfolio', val: inputData.resumeScore },
    { label: 'Aptitude & Reasoning', val: inputData.aptitudeScore },
  ];

  const skillBarsContainer = document.getElementById('res-skill-bars');
  skillBarsContainer.innerHTML = skills.map(s => {
    let color = 'var(--primary)';
    if (s.val >= 75) color = 'var(--success)';
    else if (s.val < 60) color = 'var(--danger)';

    return `
      <div style="margin-bottom:1rem;">
        <div style="display:flex; justify-content:space-between; font-size:0.875rem; font-weight:600; margin-bottom:0.35rem;">
          <span>${s.label}</span>
          <span style="color:${color}; font-weight:700;">${s.val}%</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width:${s.val}%; background:${color};"></div>
        </div>
      </div>
    `;
  }).join('');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
