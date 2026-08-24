/**
 * CareerPredict AI — Login Page Handler
 */

document.addEventListener('DOMContentLoaded', async () => {
  await window.redirectIfAuthenticated();

  const loginForm = document.getElementById('login-form');
  const submitBtn = document.getElementById('login-submit-btn');
  if (!loginForm || !submitBtn) return;

  // Quick Demo Buttons
  const demoCandidateBtn = document.getElementById('quick-demo-candidate-btn');
  const demoAdminBtn = document.getElementById('quick-demo-admin-btn');

  if (demoCandidateBtn) {
    demoCandidateBtn.onclick = () => {
      document.getElementById('login-email').value = 'alex@example.com';
      document.getElementById('login-password').value = 'candidate123';
      loginForm.dispatchEvent(new Event('submit'));
    };
  }

  if (demoAdminBtn) {
    demoAdminBtn.onclick = () => {
      document.getElementById('login-email').value = 'admin@careerpredict.ai';
      document.getElementById('login-password').value = 'admin123';
      loginForm.dispatchEvent(new Event('submit'));
    };
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      window.showToast('Please enter your email and password.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Signing in...';

    try {
      const supabase = await window.getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      window.showToast('Login successful! Redirecting...', 'success');

      // Sync user with backend
      try {
        await window.api.get('/auth/me');
      } catch (e) {}

      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      setTimeout(() => {
        window.location.href = redirect ? decodeURIComponent(redirect) : '/dashboard.html';
      }, 400);
    } catch (err) {
      window.showToast(err.message || 'Invalid email or password.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Sign In';
    }
  });

  // Forgot password button
  const forgotBtn = document.getElementById('forgot-password-link');
  if (forgotBtn) {
    forgotBtn.onclick = (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const targetEmail = prompt('Enter your registered email address to receive password reset instructions:', email || '');
      if (targetEmail) {
        window.getSupabase().then(sb => {
          sb.auth.resetPasswordForEmail(targetEmail).then(() => {
            window.showToast(`Password reset link sent to ${targetEmail}`, 'info');
          });
        });
      }
    };
  }
});
