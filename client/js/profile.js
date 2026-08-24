/**
 * CareerPredict AI — Profile Page Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const session = await window.requireAuth();
  if (!session) return;

  initSliders();
  await loadProfile();
  initProfileForm();
  initDeleteAccount();
});

function initSliders() {
  const sliders = document.querySelectorAll('input[type="range"]');
  sliders.forEach(slider => {
    const valueDisplay = document.getElementById(`${slider.id}-val`);
    if (valueDisplay) {
      valueDisplay.textContent = slider.value + '%';
      slider.addEventListener('input', () => {
        valueDisplay.textContent = slider.value + '%';
        updateCompletenessEstimate();
      });
    }
  });
}

function getProfVal(id, defaultVal = '') {
  const el = document.getElementById(id);
  return el ? el.value : defaultVal;
}

function getProfNum(id, defaultVal = 0) {
  const el = document.getElementById(id);
  if (!el) return defaultVal;
  const val = parseFloat(el.value);
  return isNaN(val) ? defaultVal : val;
}

function setProfVal(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined && val !== null) {
    el.value = val;
  }
}

async function loadProfile() {
  try {
    const res = await window.api.get('/users/profile');
    if (!res.success) throw new Error(res.message);

    const { user, profile, profileCompletion } = res.data;

    // Sidebar Info
    const nameDisp = document.getElementById('prof-name-display');
    if (nameDisp) nameDisp.textContent = user.name || 'Candidate';
    const emailDisp = document.getElementById('prof-email-display');
    if (emailDisp) emailDisp.textContent = user.email || '';
    const roleBadge = document.getElementById('prof-role-badge');
    if (roleBadge) roleBadge.textContent = user.role === 'admin' ? 'Administrator' : 'Job Candidate';

    // Completeness Meter
    updateCompletenessUI(profileCompletion || 60);

    // Form values
    setProfVal('prof-name', user.name || '');
    setProfVal('prof-email', user.email || '');

    if (profile) {
      if (profile.age) setProfVal('prof-age', profile.age);
      if (profile.gender) setProfVal('prof-gender', profile.gender);
      if (profile.location) setProfVal('prof-location', profile.location);
      if (profile.educationLevel) setProfVal('prof-education', profile.educationLevel);
      if (profile.degree) setProfVal('prof-degree', profile.degree);
      if (profile.fieldOfStudy) setProfVal('prof-field', profile.fieldOfStudy);

      if (profile.yearsExperience !== undefined) setProfVal('prof-experience', profile.yearsExperience);
      if (profile.internshipCount !== undefined) setProfVal('prof-internships', profile.internshipCount);
      if (profile.previousJobs !== undefined) setProfVal('prof-previous-jobs', profile.previousJobs);

      const skillKeys = [
        'technicalSkillScore', 'webDevelopmentScore', 'databaseScore',
        'dataStructuresScore', 'algorithmScore', 'machineLearningScore',
        'cloudScore', 'communicationScore', 'leadershipScore',
        'teamworkScore', 'problemSolvingScore', 'resumeScore',
        'interviewScore', 'aptitudeScore', 'githubActivity'
      ];

      skillKeys.forEach(k => {
        const slider = document.getElementById(`prof-${k}`);
        if (slider && profile[k] !== undefined) {
          slider.value = profile[k];
          const valEl = document.getElementById(`prof-${k}-val`);
          if (valEl) valEl.textContent = profile[k] + '%';
        }
      });

      if (profile.projectCount !== undefined) setProfVal('prof-projects', profile.projectCount);
      if (profile.certificationCount !== undefined) setProfVal('prof-certifications', profile.certificationCount);

      if (profile.desiredRole) setProfVal('prof-desired-role', profile.desiredRole);
      if (profile.workPreference) setProfVal('prof-work-pref', profile.workPreference);
      if (profile.expectedSalary) setProfVal('prof-salary', profile.expectedSalary);
      if (profile.relocation) setProfVal('prof-relocation', profile.relocation);
    }
  } catch (err) {
    console.error('Error loading profile:', err);
    window.showToast('Could not load profile data.', 'error');
  }
}

function updateCompletenessUI(percentage) {
  const percentEl = document.getElementById('completeness-percent');
  const barEl = document.getElementById('completeness-bar-fill');
  if (percentEl) percentEl.textContent = `${percentage}%`;
  if (barEl) barEl.style.width = `${percentage}%`;
}

function updateCompletenessEstimate() {
  // Live recalculation
  let score = 30;
  if (getProfVal('prof-education')) score += 10;
  if (getProfVal('prof-field')) score += 10;
  if (getProfVal('prof-experience')) score += 10;
  if (getProfNum('prof-technicalSkillScore') > 0) score += 15;
  if (getProfNum('prof-communicationScore') > 0) score += 10;
  if (getProfNum('prof-problemSolvingScore') > 0) score += 10;
  if (getProfNum('prof-projects') > 0) score += 10;
  if (getProfNum('prof-resumeScore') > 0) score += 5;

  updateCompletenessUI(Math.min(100, score));
}

function initProfileForm() {
  const form = document.getElementById('profile-edit-form');
  const submitBtn = document.getElementById('profile-save-btn');
  if (!form || !submitBtn) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Saving Changes...';

    const updates = {
      name: getProfVal('prof-name', '').trim(),
      age: getProfNum('prof-age', 22),
      gender: getProfVal('prof-gender', 'Male'),
      location: getProfVal('prof-location', '').trim(),
      educationLevel: getProfVal('prof-education', "Bachelor's"),
      degree: getProfVal('prof-degree', '').trim(),
      fieldOfStudy: getProfVal('prof-field', 'Computer Science'),

      yearsExperience: getProfNum('prof-experience', 0),
      internshipCount: getProfNum('prof-internships', 0),
      previousJobs: getProfNum('prof-previous-jobs', 0),

      technicalSkillScore: getProfNum('prof-technicalSkillScore', 50),
      webDevelopmentScore: getProfNum('prof-webDevelopmentScore', 50),
      databaseScore: getProfNum('prof-databaseScore', 50),
      dataStructuresScore: getProfNum('prof-dataStructuresScore', 50),
      algorithmScore: getProfNum('prof-algorithmScore', 50),
      machineLearningScore: getProfNum('prof-machineLearningScore', 50),
      cloudScore: getProfNum('prof-cloudScore', 50),

      communicationScore: getProfNum('prof-communicationScore', 50),
      leadershipScore: getProfNum('prof-leadershipScore', 50),
      teamworkScore: getProfNum('prof-teamworkScore', 50),
      problemSolvingScore: getProfNum('prof-problemSolvingScore', 50),

      projectCount: getProfNum('prof-projects', 0),
      certificationCount: getProfNum('prof-certifications', 0),
      resumeScore: getProfNum('prof-resumeScore', 50),
      interviewScore: getProfNum('prof-interviewScore', 50),
      aptitudeScore: getProfNum('prof-aptitudeScore', 50),
      githubActivity: getProfNum('prof-githubActivity', 50),

      desiredRole: getProfVal('prof-desired-role', 'Software Developer'),
      workPreference: getProfVal('prof-work-pref', 'Hybrid'),
      expectedSalary: getProfVal('prof-salary', '$95,000').trim(),
      relocation: getProfVal('prof-relocation', 'Yes'),
    };

    try {
      const res = await window.api.put('/users/profile', updates);
      if (res.success) {
        window.showToast('Profile updated successfully!', 'success');
        updateCompletenessUI(res.data.profileCompletion);
        document.getElementById('prof-name-display').textContent = updates.name;
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      window.showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Save Profile Changes';
    }
  });
}

function initDeleteAccount() {
  const deleteBtn = document.getElementById('delete-account-btn');
  if (!deleteBtn) return;

  deleteBtn.addEventListener('click', () => {
    window.showConfirmModal({
      title: 'Permanently Delete Account?',
      message: 'This action cannot be undone. All your candidate profile details and prediction history will be wiped.',
      confirmText: 'Delete Everything',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          const res = await window.api.delete('/users/account');
          if (res.success) {
            const supabase = await window.getSupabase();
            await supabase.auth.signOut();
            window.showToast('Account deleted. Redirecting...', 'info');
            setTimeout(() => { window.location.href = '/register.html'; }, 800);
          }
        } catch (err) {
          window.showToast(err.message || 'Could not delete account.', 'error');
        }
      },
    });
  });
}
