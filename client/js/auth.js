/**
 * CareerPredict AI — Route Protection & Auth Guard
 */

async function requireAuth() {
  const supabase = await window.getSupabase();
  const { data } = await supabase.auth.getSession();

  if (!data?.session) {
    const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login.html?redirect=${currentUrl}`;
    return null;
  }

  return data.session;
}

async function requireAdmin() {
  const session = await requireAuth();
  if (!session) return null;

  try {
    const res = await window.api.get('/auth/me');
    if (!res.success || res.data.role !== 'admin') {
      window.showToast('Access restricted: Administrator role required.', 'error');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1000);
      return null;
    }
    return res.data;
  } catch (err) {
    window.location.href = '/dashboard.html';
    return null;
  }
}

async function redirectIfAuthenticated() {
  const supabase = await window.getSupabase();
  const { data } = await supabase.auth.getSession();

  if (data?.session) {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    window.location.href = redirect ? decodeURIComponent(redirect) : '/dashboard.html';
  }
}

window.requireAuth = requireAuth;
window.requireAdmin = requireAdmin;
window.redirectIfAuthenticated = redirectIfAuthenticated;
