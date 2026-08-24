/**
 * CareerPredict AI — Dashboard Controller
 */

let skillRadarChart = null;

document.addEventListener('DOMContentLoaded', async () => {
  const session = await window.requireAuth();
  if (!session) return;

  await loadDashboardData();
});

async function loadDashboardData() {
  try {
    // 1. Fetch Profile & User Me
    const [meRes, profRes, sumRes, histRes] = await Promise.all([
      window.api.get('/auth/me'),
      window.api.get('/users/profile'),
      window.api.get('/predictions/stats/summary'),
      window.api.get('/predictions?limit=5'),
    ]);

    const user = meRes.data;
    const profile = profRes.data.profile || {};
    const summary = sumRes.data;
    const history = histRes.data || [];

    // Greeting
    const welcomeEl = document.getElementById('dash-welcome-name');
    if (welcomeEl) {
      welcomeEl.textContent = user.name || 'Candidate';
    }

    // Stats Grid
    const readinessEl = document.getElementById('dash-readiness-val');
    const latestProbEl = document.getElementById('dash-latest-prob-val');
    const totalPredsEl = document.getElementById('dash-total-preds-val');
    const strongestSkillEl = document.getElementById('dash-strongest-skill-val');

    if (summary.latestPrediction) {
      readinessEl.textContent = `${summary.latestPrediction.careerReadinessScore || 75}/100`;
      latestProbEl.textContent = `${summary.latestPrediction.jobProbability}%`;
      
      const deltaBadge = document.getElementById('dash-prob-delta-badge');
      if (deltaBadge && summary.probabilityDelta !== 0) {
        const isPos = summary.probabilityDelta > 0;
        deltaBadge.className = `badge ${isPos ? 'badge-success' : 'badge-danger'}`;
        deltaBadge.textContent = `${isPos ? '+' : ''}${summary.probabilityDelta}% vs prev`;
        deltaBadge.style.display = 'inline-flex';
      }
    } else {
      readinessEl.textContent = '—';
      latestProbEl.textContent = '—';
    }

    totalPredsEl.textContent = summary.totalPredictions;
    strongestSkillEl.textContent = summary.strongestSkill;

    // Highlight Banner
    const highlightCard = document.getElementById('dash-prediction-highlight');
    if (summary.latestPrediction) {
      highlightCard.style.display = 'flex';
      document.getElementById('dash-highlight-prob').textContent = `${summary.latestPrediction.jobProbability}%`;
      document.getElementById('dash-highlight-conf').textContent = summary.latestPrediction.confidence;
      document.getElementById('dash-highlight-label').textContent = summary.latestPrediction.predictionLabel;
      document.getElementById('dash-highlight-date').textContent = new Date(summary.latestPrediction.createdAt).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric'
      });
      document.getElementById('dash-view-latest-btn').href = `/prediction-details.html?id=${summary.latestPrediction._id}`;
    } else {
      highlightCard.style.display = 'none';
      const emptyBanner = document.getElementById('dash-empty-banner');
      if (emptyBanner) emptyBanner.style.display = 'block';
    }

    // Render Chart.js Radar Chart
    renderSkillRadar(summary.latestPrediction ? summary.latestPrediction.inputSnapshot : profile);

    // Render Recent History Table
    renderRecentHistory(history);
  } catch (err) {
    console.error('Error loading dashboard:', err);
    window.showToast('Failed to load dashboard statistics.', 'error');
  }
}

function renderSkillRadar(data) {
  const canvas = document.getElementById('skillRadarCanvas');
  if (!canvas || !window.Chart) return;

  const tech = Number(data?.technicalSkillScore || 70);
  const comm = Number(data?.communicationScore || 65);
  const prob = Number(data?.problemSolvingScore || 75);
  const iv = Number(data?.interviewScore || 68);
  const res = Number(data?.resumeScore || 72);
  const apt = Number(data?.aptitudeScore || 70);

  if (skillRadarChart) {
    skillRadarChart.destroy();
  }

  skillRadarChart = new window.Chart(canvas, {
    type: 'radar',
    data: {
      labels: ['Technical', 'Communication', 'Problem Solving', 'Interview', 'Resume Quality', 'Aptitude'],
      datasets: [
        {
          label: 'Your Current Scores',
          data: [tech, comm, prob, iv, res, apt],
          backgroundColor: 'rgba(79, 70, 229, 0.2)',
          borderColor: '#4f46e5',
          pointBackgroundColor: '#4f46e5',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#4f46e5',
          borderWidth: 2,
        },
        {
          label: 'Industry Placement Standard',
          data: [75, 70, 75, 75, 75, 70],
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: '#10b981',
          pointBackgroundColor: '#10b981',
          borderDash: [4, 4],
          borderWidth: 1.5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { color: '#e2e8f0' },
          grid: { color: '#f1f5f9' },
          suggestedMin: 0,
          suggestedMax: 100,
          ticks: { stepSize: 20, display: false },
          pointLabels: {
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' },
            color: '#475569',
          },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } },
        },
      },
    },
  });
}

function renderRecentHistory(history) {
  const container = document.getElementById('dash-recent-history-tbody');
  if (!container) return;

  if (history.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted);">
          No assessments recorded yet. <a href="/predict.html" style="font-weight:600;">Start your first prediction →</a>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = history.map(p => {
    const isLikely = p.prediction === 1;
    const badgeClass = isLikely ? 'badge-success' : 'badge-warning';
    const dateStr = new Date(p.createdAt).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    return `
      <tr>
        <td><strong>${dateStr}</strong></td>
        <td>
          <div style="font-weight:800; font-size:1.05rem; color:${p.jobProbability >= 60 ? 'var(--success)' : 'var(--warning)'};">
            ${p.jobProbability}%
          </div>
        </td>
        <td>
          <span class="badge ${badgeClass}">${p.predictionLabel}</span>
        </td>
        <td><span class="badge badge-info">${p.confidence}</span></td>
        <td>
          <a href="/prediction-details.html?id=${p._id}" class="btn btn-secondary btn-sm" style="padding:0.25rem 0.6rem; font-size:0.775rem;">
            View Details →
          </a>
        </td>
      </tr>
    `;
  }).join('');
}
