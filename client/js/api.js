/**
 * CareerPredict AI — API Client
 * Wraps fetch calls with Supabase Bearer authentication and unified response formatting.
 */

const API_BASE = '/api';

class ApiClient {
  async getAuthHeader() {
    const supabase = await window.getSupabase();
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      return { Authorization: `Bearer ${data.session.access_token}` };
    }
    return {};
  }

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const authHeaders = await this.getAuthHeader();

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        // If unauthorized, and on a protected page, redirect to login
        const path = window.location.pathname;
        const publicPages = ['/', '/index.html', '/login', '/login.html', '/register', '/register.html', '/about', '/about.html', '/model', '/model.html', '/privacy', '/privacy.html'];
        const isPublic = publicPages.some(p => path.endsWith(p) || path === p);
        if (!isPublic) {
          window.location.href = '/login.html';
        }
      }

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, err);
      throw err;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

window.api = new ApiClient();
