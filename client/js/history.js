/**
 * CareerPredict AI — History Controller
 */

let currentPage = 1;
let currentFilter = 'all';
let currentSort = 'newest';

document.addEventListener('DOMContentLoaded', async () => {
  const session = await window.requireAuth();
  if (!session) return;

  initHistoryControls();
  await loadHistory();
});

function initHistoryControls() {
  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      currentPage = 1;
      loadHistory();
    });
  });

  // Sort select
  const sortSelect = document.getElementById('history-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentSort = sortSelect.value;
      currentPage = 1;
      loadHistory();
    });
  }

  // Pagination buttons
  document.getElementById('prev-page-btn')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadHistory();
    }
  });

  document.getElementById('next-page-btn')?.addEventListener('click', () => {
    currentPage++;
    loadHistory();
  });
}

async function loadHistory() {
  const tbody = document.getElementById('history-tbody');
  const emptyState = document.getElementById('history-empty-state');
  const tableWrap = document.getElementById('history-table-wrapper');

  tbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align:center; padding:3rem;">
        <span class="spinner spinner-primary"></span>
        <p style="margin-top:0.5rem;">Loading prediction history...</p>
      </td>
    </tr>
  `;

  try {
    const url = `/predictions?page=${currentPage}&limit=10&filter=${currentFilter}&sort=${currentSort}`;
    const res = await window.api.get(url);

    if (!res.success) throw new Error(res.message);

    const { data, page, totalPages, total } = res;

    // Update pagination indicator
    document.getElementById('page-indicator').textContent = `Page ${page} of ${totalPages || 1} (${total} total records)`;
    document.getElementById('prev-page-btn').disabled = page <= 1;
    document.getElementById('next-page-btn').disabled = page >= totalPages;

    if (data.length === 0) {
      tableWrap.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    tableWrap.style.display = 'block';
    emptyState.style.display = 'none';

    tbody.innerHTML = data.map(p => {
      const isLikely = p.prediction === 1;
      const badgeClass = isLikely ? 'badge-success' : 'badge-warning';
      const dateStr = new Date(p.createdAt).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      const snap = p.inputSnapshot || {};
      const role = snap.desiredRole || 'Software Developer';

      return `
        <tr>
          <td><strong>${dateStr}</strong></td>
          <td>
            <div style="font-weight:600; font-size:0.875rem;">${role}</div>
            <div style="font-size:0.75rem; color:var(--text-light);">${snap.educationLevel || "Bachelor's"}</div>
          </td>
          <td>
            <div style="font-size:1.1rem; font-weight:800; color:${p.jobProbability >= 60 ? 'var(--success)' : 'var(--warning)'};">
              ${p.jobProbability}%
            </div>
            <div style="font-size:0.7rem; color:var(--text-light);">No-job: ${p.noJobProbability}%</div>
          </td>
          <td>
            <span class="badge ${badgeClass}">${p.predictionLabel}</span>
          </td>
          <td><span class="badge badge-info">${p.confidence}</span></td>
          <td>
            <span style="font-family:var(--font-mono); font-size:0.8rem; background:#f1f5f9; padding:0.15rem 0.4rem; border-radius:4px;">
              v${p.modelVersion || '1.0.0'}
            </span>
          </td>
          <td style="text-align:right; white-space:nowrap;">
            <a href="/prediction-details.html?id=${p._id}" class="btn btn-secondary btn-sm" style="padding:0.3rem 0.65rem; font-size:0.8rem; margin-right:0.35rem;">
              View
            </a>
            <button onclick="confirmDeletePrediction('${p._id}')" class="btn btn-outline btn-sm" style="padding:0.3rem 0.65rem; font-size:0.8rem; color:var(--danger); border-color:#fecaca;">
              Delete
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('History load error:', err);
    window.showToast('Failed to load history records.', 'error');
  }
}

function confirmDeletePrediction(id) {
  window.showConfirmModal({
    title: 'Delete Prediction Record?',
    message: 'Are you sure you want to delete this prediction? This assessment snapshot cannot be restored.',
    confirmText: 'Delete Permanently',
    confirmClass: 'btn-danger',
    onConfirm: async () => {
      try {
        const res = await window.api.delete(`/predictions/${id}`);
        if (res.success) {
          window.showToast('Prediction deleted successfully.', 'success');
          loadHistory();
        }
      } catch (err) {
        window.showToast(err.message || 'Could not delete prediction.', 'error');
      }
    },
  });
}
window.confirmDeletePrediction = confirmDeletePrediction;
