/**
 * CareerPredict AI — Supabase Authentication Client
 * Manages Supabase Auth, sessions, tokens, and auth state listeners.
 */

let supabaseClient = null;
let appConfig = null;

// Demo session local storage key
const DEMO_SESSION_KEY = 'careerpredict_demo_session';

/**
 * Fetch public app configuration from backend
 */
async function fetchConfig() {
  if (appConfig) return appConfig;
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      appConfig = data.data;
      return appConfig;
    }
  } catch (err) {
    console.warn('Could not fetch server config, using defaults:', err);
  }
  appConfig = { demoMode: true, supabaseUrl: '', supabaseAnonKey: '' };
  return appConfig;
}

/**
 * Initialize Supabase client
 */
async function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const config = await fetchConfig();

  // If Supabase JS CDN is loaded and keys exist
  if (window.supabase && config.supabaseUrl && config.supabaseAnonKey) {
    try {
      supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return supabaseClient;
    } catch (e) {
      console.warn('Failed to init real Supabase client:', e);
    }
  }

  // Fallback demo auth wrapper implementing Supabase Auth API interface
  supabaseClient = createDemoAuthClient();
  return supabaseClient;
}

function createDemoAuthClient() {
  const listeners = [];

  const notifyChange = (event, session) => {
    listeners.forEach(cb => {
      try { cb(event, session); } catch (e) {}
    });
  };

  return {
    auth: {
      async getSession() {
        const saved = localStorage.getItem(DEMO_SESSION_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            return { data: { session: parsed }, error: null };
          } catch (e) {
            localStorage.removeItem(DEMO_SESSION_KEY);
          }
        }
        return { data: { session: null }, error: null };
      },

      async getUser() {
        const { data } = await this.getSession();
        return { data: { user: data.session ? data.session.user : null }, error: null };
      },

      async signUp({ email, password, options = {} }) {
        if (!email || !password) {
          return { data: null, error: { message: 'Email and password are required.' } };
        }
        if (password.length < 6) {
          return { data: null, error: { message: 'Password must be at least 6 characters long.' } };
        }

        const userId = 'supa_usr_' + Date.now();
        const fullName = options.data?.full_name || options.data?.name || email.split('@')[0];
        
        // Base64 encoded demo token
        const b64Email = btoa(email);
        const b64Name = btoa(fullName);
        const token = `demo_token_${userId}_${b64Email}_${b64Name}`;

        const user = {
          id: userId,
          email,
          user_metadata: { full_name: fullName },
          created_at: new Date().toISOString(),
        };

        const session = {
          access_token: token,
          token_type: 'bearer',
          user,
        };

        localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
        notifyChange('SIGNED_IN', session);

        return { data: { user, session }, error: null };
      },

      async signInWithPassword({ email, password }) {
        if (!email || !password) {
          return { data: null, error: { message: 'Please enter your email and password.' } };
        }

        let userId = 'supa_demo_002';
        let fullName = 'Alex Johnson';

        if (email.includes('admin')) {
          userId = 'supa_admin_001';
          fullName = 'System Admin';
        } else {
          fullName = email.split('@')[0].replace('.', ' ');
          fullName = fullName.charAt(0).toUpperCase() + fullName.slice(1);
        }

        const b64Email = btoa(email);
        const b64Name = btoa(fullName);
        const token = `demo_token_${userId}_${b64Email}_${b64Name}`;

        const user = {
          id: userId,
          email,
          user_metadata: { full_name: fullName },
          created_at: new Date().toISOString(),
        };

        const session = {
          access_token: token,
          token_type: 'bearer',
          user,
        };

        localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
        notifyChange('SIGNED_IN', session);

        return { data: { user, session }, error: null };
      },

      async signOut() {
        localStorage.removeItem(DEMO_SESSION_KEY);
        notifyChange('SIGNED_OUT', null);
        return { error: null };
      },

      async resetPasswordForEmail(email) {
        if (!email) return { error: { message: 'Email is required' } };
        return { data: {}, error: null };
      },

      onAuthStateChange(callback) {
        listeners.push(callback);
        // Initial state
        this.getSession().then(({ data }) => {
          callback(data.session ? 'SIGNED_IN' : 'SIGNED_OUT', data.session);
        });
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                const idx = listeners.indexOf(callback);
                if (idx !== -1) listeners.splice(idx, 1);
              },
            },
          },
        };
      },
    },
  };
}

window.getSupabase = getSupabase;
