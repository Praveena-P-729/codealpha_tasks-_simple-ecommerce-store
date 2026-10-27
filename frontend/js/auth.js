/**
 * Simple E-Commerce Store - Authentication & User State Service
 */

class AuthService {
  constructor() {
    this.userKey = 'aura_auth_user';
    this.tokenKey = 'aura_auth_token';
    this.currentUser = this.loadUser();
  }

  loadUser() {
    try {
      const data = localStorage.getItem(this.userKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  getUser() {
    return this.currentUser;
  }

  isLoggedIn() {
    return !!this.currentUser;
  }

  saveSession(user, token) {
    this.currentUser = user;
    try {
      localStorage.setItem(this.userKey, JSON.stringify(user));
      if (token) localStorage.setItem(this.tokenKey, token);
    } catch (e) {
      console.error('Failed to save session:', e);
    }
    this.updateNav();
  }

  async login(email, password) {
    const res = await api.login(email, password);
    if (res.success && res.data) {
      this.saveSession(res.data.user, res.data.token);
      return res.data.user;
    }
    throw new Error(res.message || 'Login failed');
  }

  async register(userData) {
    const res = await api.register(userData);
    if (res.success && res.data) {
      this.saveSession(res.data.user, res.data.token);
      return res.data.user;
    }
    throw new Error(res.message || 'Registration failed');
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.tokenKey);
    this.updateNav();
    if (typeof showToast === 'function') {
      showToast('You have been signed out.', 'info');
    }
    // If currently on login page or checkout, refresh or stay
    if (window.location.pathname.includes('login.html')) {
      window.location.reload();
    }
  }

  updateNav() {
    const containers = document.querySelectorAll('.auth-nav-slot');
    containers.forEach(slot => {
      if (this.isLoggedIn()) {
        const firstName = this.currentUser.name.split(' ')[0];
        slot.innerHTML = `
          <div class="user-badge-menu" style="display: flex; align-items: center; gap: 0.5rem; background: #f1f5f9; padding: 0.35rem 0.75rem; border-radius: 9999px; border: 1px solid var(--border);">
            <span style="font-size: 0.95rem;">👋</span>
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--dark);">${firstName}</span>
            <button type="button" onclick="auth.logout()" title="Sign Out" style="font-size: 0.75rem; color: var(--danger); font-weight: 600; margin-left: 4px; padding: 2px 4px; cursor: pointer;">
              (Logout)
            </button>
          </div>
        `;
      } else {
        slot.innerHTML = `
          <a href="login.html" class="nav-link" style="display: flex; align-items: center; gap: 0.35rem;">
            <span>👤</span>
            <span>Sign In</span>
          </a>
        `;
      }
    });
  }
}

// Global Auth instance
window.auth = new AuthService();

document.addEventListener('DOMContentLoaded', () => {
  window.auth.updateNav();
});
