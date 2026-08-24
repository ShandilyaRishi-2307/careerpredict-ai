/**
 * CareerPredict AI — Main UI & Navigation Manager
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initToasts();
  initModals();
  checkAuthAndRenderNav();
});

// Toast notification helper
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  toast.innerHTML = `
    <span style="font-weight:700; color:var(--${type === 'info' ? 'primary' : type})">${iconMap[type] || 'ℹ'}</span>
    <span style="flex:1;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px) scale(0.95)';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}
window.showToast = showToast;

// Confirmation Modal helper
function showConfirmModal({ title, message, confirmText = 'Confirm', confirmClass = 'btn-danger', onConfirm }) {
  let backdrop = document.getElementById('global-confirm-modal');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'global-confirm-modal';
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal-card">
        <div class="modal-body">
          <h3 id="modal-title" style="margin-bottom:0.5rem;">${title}</h3>
          <p id="modal-msg">${message}</p>
        </div>
        <div class="modal-footer">
          <button id="modal-cancel-btn" class="btn btn-secondary btn-sm">Cancel</button>
          <button id="modal-confirm-btn" class="btn ${confirmClass} btn-sm">${confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
  } else {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-msg').textContent = message;
    const confirmBtn = document.getElementById('modal-confirm-btn');
    confirmBtn.className = `btn ${confirmClass} btn-sm`;
    confirmBtn.textContent = confirmText;
  }

  backdrop.classList.add('active');

  const close = () => {
    backdrop.classList.remove('active');
  };

  document.getElementById('modal-cancel-btn').onclick = close;
  backdrop.onclick = (e) => { if (e.target === backdrop) close(); };

  document.getElementById('modal-confirm-btn').onclick = () => {
    close();
    if (typeof onConfirm === 'function') onConfirm();
  };
}
window.showConfirmModal = showConfirmModal;

function initNavbar() {
  const toggleBtn = document.querySelector('.nav-toggle-btn');
  const navLinks = document.querySelector('.nav-links');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
    });
  }

  // Highlight active link
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (path === href || path.endsWith(href) || (href === '/' && (path === '/' || path === '/index.html')))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

async function checkAuthAndRenderNav() {
  try {
    const supabase = await window.getSupabase();
    const { data } = await supabase.auth.getSession();
    const session = data?.session;

    const navActions = document.getElementById('nav-actions-container');
    if (!navActions) return;

    if (session && session.user) {
      // Get role from /api/auth/me
      let userRole = 'user';
      let userName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
      try {
        const meRes = await window.api.get('/auth/me');
        if (meRes.success) {
          userRole = meRes.data.role;
          userName = meRes.data.name || userName;
        }
      } catch (e) {}

      const initials = userName.slice(0, 2).toUpperCase();

      navActions.innerHTML = `
        <a href="/predict.html" class="btn btn-primary btn-sm" id="nav-predict-cta-btn">
          ⚡ Predict Probability
        </a>
        <div class="user-menu-dropdown">
          <button class="user-menu-btn" id="user-menu-trigger">
            <span class="user-avatar">${initials}</span>
            <span style="max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${userName}</span>
            <span style="font-size:0.7rem;">▼</span>
          </button>
          <div class="user-dropdown-menu" id="user-dropdown-menu">
            <a href="/dashboard.html" class="dropdown-item">📊 Dashboard</a>
            <a href="/profile.html" class="dropdown-item">👤 Career Profile</a>
            <a href="/history.html" class="dropdown-item">📜 Prediction History</a>
            ${userRole === 'admin' ? '<a href="/admin.html" class="dropdown-item" style="color:var(--secondary); font-weight:700;">🛡️ Admin Dashboard</a>' : ''}
            <div class="dropdown-divider"></div>
            <button class="dropdown-item danger" id="nav-logout-btn" style="width:100%; border:none; background:none; cursor:pointer; text-align:left;">🚪 Log Out</button>
          </div>
        </div>
      `;

      // Dropdown toggle
      const trigger = document.getElementById('user-menu-trigger');
      const menu = document.getElementById('user-dropdown-menu');
      if (trigger && menu) {
        trigger.onclick = (e) => {
          e.stopPropagation();
          menu.classList.toggle('active');
        };
        document.addEventListener('click', () => menu.classList.remove('active'));
      }

      // Logout button
      const logoutBtn = document.getElementById('nav-logout-btn');
      if (logoutBtn) {
        logoutBtn.onclick = async () => {
          await supabase.auth.signOut();
          showToast('Logged out successfully', 'info');
          setTimeout(() => { window.location.href = '/login.html'; }, 300);
        };
      }
    } else {
      navActions.innerHTML = `
        <a href="/login.html" class="btn btn-secondary btn-sm" id="nav-login-btn">Log In</a>
        <a href="/register.html" class="btn btn-primary btn-sm" id="nav-register-btn">Register Free</a>
      `;
    }
  } catch (err) {
    console.error('Navbar Auth Check Error:', err);
  }
}

function initToasts() {}
function initModals() {}
