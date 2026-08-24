/**
 * CareerPredict AI — Registration Page Handler
 */

document.addEventListener('DOMContentLoaded', async () => {
  await window.redirectIfAuthenticated();

  const registerForm = document.getElementById('register-form');
  const submitBtn = document.getElementById('register-submit-btn');
  if (!registerForm || !submitBtn) return;

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('register-name');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    const confirmPasswordInput = document.getElementById('register-confirm-password');

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

    // Frontend validation
    if (!name || !email || !password) {
      window.showToast('Please fill out all required fields.', 'error');
      return;
    }

    if (password.length < 6) {
      window.showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      window.showToast('Passwords do not match.', 'error');
      return;
    }

    // Submit via Supabase Auth
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Creating Account...';

    try {
      const supabase = await window.getSupabase();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        throw error;
      }

      window.showToast('Account created successfully! Welcome to CareerPredict AI.', 'success');

      // Sync with Express backend and redirect
      setTimeout(async () => {
        try {
          await window.api.get('/auth/me');
        } catch (e) {}
        window.location.href = '/dashboard.html';
      }, 500);
    } catch (err) {
      window.showToast(err.message || 'Registration failed. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Create Account';
    }
  });
});
