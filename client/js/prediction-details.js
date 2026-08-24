/**
 * CareerPredict AI — Prediction Details Controller
 */

let detailRadarChart = null;

document.addEventListener('DOMContentLoaded', async () => {
  const session = await window.requireAuth();
  if (!session) return;

  const params = new URLSearchParams(window.location.search);
  const predictionId = params.get('id');

  if (!predictionId) {
    window.showToast('No prediction ID specified.', 'error');
    setTimeout(() => { window.location.href = '/history.html'; }, 1000);
    return;
  }

  await loadPredictionDetails(predictionId);
});

async function loadPredictionDetails(id) {
  try {
    const res = await window.api.get(`/predictions/${id}`);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Prediction not found');
    }

    const p = res.data;
    const snap = p.inputSnapshot || {};

    // Header info
    document.getElementById('detail-date').textContent = new Date(p.createdAt).toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    document.getElementById('detail-model-version').textContent = `Model Version: ${p.modelVersion || '1.0.0'}`;

    // Big probability metrics
    document.getElementById('detail-job-prob').textContent = `${p.jobProbability}%`;
    document.getElementById('detail-no-job-prob').textContent = `${p.noJobProbability}%`;
    document.getElementById('detail-pred-label').textContent = p.predictionLabel;
    document.getElementById('detail-confidence-badge').textContent = p.confidence;
    document.getElementById('detail-readiness-score').textContent = `${p.careerReadinessScore || 75}/100`;

    // Snapshot profile card
    document.getElementById('snap-role').textContent = snap.desiredRole || 'Software Developer';
    document.getElementById('snap-edu').textContent = `${snap.educationLevel || "Bachelor's"} in ${snap.fieldOfStudy || 'Computer Science'}`;
    document.getElementById('snap-exp').textContent = `${snap.yearsExperience || 0} years experience`;
    document.getElementById('snap-projects').textContent = `${snap.projectCount || 0} completed projects`;
    document.getElementById('snap-certs').textContent = `${snap.certificationCount || 0} certifications`;
    document.getElementById('snap-internships').textContent = `${snap.internshipCount || 0} internships`;

    // Radar Chart
    renderDetailRadar(snap);

    // Strengths & Weaknesses
    const strengthsContainer = document.getElementById('detail-strengths-list');
    strengthsContainer.innerHTML = (p.strengths || []).map(s => `
      <li style="display:flex; align-items:flex-start; gap:0.5rem; margin-bottom:0.5rem; font-size:0.9rem;">
        <span style="color:var(--success); font-weight:bold;">✓</span> <span>${s}</span>
      </li>
    `).join('');

    const weaknessesContainer = document.getElementById('detail-weaknesses-list');
    weaknessesContainer.innerHTML = (p.weaknesses || []).map(w => `
      <li style="display:flex; align-items:flex-start; gap:0.5rem; margin-bottom:0.5rem; font-size:0.9rem;">
        <span style="color:var(--danger); font-weight:bold;">⚠</span> <span>${w}</span>
      </li>
    `).join('');

    // Recommendations list
    const recsContainer = document.getElementById('detail-recs-list');
    recsContainer.innerHTML = (p.recommendations || []).map((r, i) => `
      <div class="rec-item">
        <span class="rec-bullet">${i + 1}</span>
        <p style="margin:0; font-size:0.925rem; font-weight:500;">${r}</p>
      </div>
    `).join('');

    // Role gaps
    const gaps = p.roleGaps;
    if (gaps) {
      document.getElementById('detail-target-role-name').textContent = gaps.targetRole || snap.desiredRole;
      document.getElementById('detail-strong-areas').innerHTML = (gaps.strongAreas || []).map(a => `
        <span class="badge badge-success" style="font-size:0.8rem; padding:0.35rem 0.65rem;">${a}</span>
      `).join(' ');
      document.getElementById('detail-improve-areas').innerHTML = (gaps.improvementAreas || []).map(a => `
        <span class="badge badge-warning" style="font-size:0.8rem; padding:0.35rem 0.65rem;">${a}</span>
      `).join(' ');
    }
  } catch (err) {
    console.error('Error loading prediction details:', err);
    window.showToast('Could not load prediction details.', 'error');
  }
}

function renderDetailRadar(snap) {
  const canvas = document.getElementById('detailRadarCanvas');
  if (!canvas || !window.Chart) return;

  const tech = Number(snap.technicalSkillScore || 70);
  const comm = Number(snap.communicationScore || 65);
  const prob = Number(snap.problemSolvingScore || 75);
  const iv = Number(snap.interviewScore || 68);
  const res = Number(snap.resumeScore || 72);
  const apt = Number(snap.aptitudeScore || 70);

  if (detailRadarChart) detailRadarChart.destroy();

  detailRadarChart = new window.Chart(canvas, {
    type: 'radar',
    data: {
      labels: ['Technical', 'Communication', 'Problem Solving', 'Interview', 'Resume', 'Aptitude'],
      datasets: [
        {
          label: 'Snapshot Scores',
          data: [tech, comm, prob, iv, res, apt],
          backgroundColor: 'rgba(79, 70, 229, 0.25)',
          borderColor: '#4f46e5',
          pointBackgroundColor: '#4f46e5',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: 100,
          ticks: { display: false },
          pointLabels: {
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' },
            color: '#334155',
          },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}
