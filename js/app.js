/* ================================================
   APP.JS — Main Entry Point & Event Wiring
   ================================================ */
'use strict';

(async function init() {
  // Update header date on load
  UI.updateHeaderDate();
  setInterval(UI.updateHeaderDate.bind(UI), 60000);

  // Build sidebar user info helper
  function buildUserArea() {
    const user = document.getElementById('sidebar-user-info');
    if (user) {
      user.innerHTML = `
        ${UI.avatar(Auth.getName(), 'avatar')}
        <div class="sidebar-user-info-text">
          <div class="sidebar-user-name">${Auth.getName()}</div>
          <div class="sidebar-user-role">${Auth.getRole()}</div>
        </div>`;
    }
    const headerAvatar = document.getElementById('header-avatar');
    if (headerAvatar) headerAvatar.textContent = Auth.getAvatar();
  }

  // ── Show correct page on load ──────────────────
  function showApp() {
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('app-page').classList.add('active');
    Router.buildSidebar();
    buildUserArea();
    UI.renderNotifications();
    Router.navigate(Router.getDefaultPage(), true);

    if (Auth.getRole() === 'admin' && window.AI) {
      window.AI.show();
    } else if (window.AI) {
      window.AI.hide();
    }
  }

  function showLogin() {
    document.getElementById('app-page').classList.remove('active');
    document.getElementById('login-page').classList.add('active');
  }

  await Auth.init();
  if (Auth.isLoggedIn()) {
    showApp();
  } else {
    showLogin();
  }

  // ── Auth Tabs ──────────────────────────────────
  document.getElementById('tab-login')?.addEventListener('click', function() {
    this.classList.replace('btn-ghost','btn-secondary');
    document.getElementById('tab-register').classList.replace('btn-secondary','btn-ghost');
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('otp-form').style.display = 'none';
  });

  document.getElementById('tab-register')?.addEventListener('click', function() {
    this.classList.replace('btn-ghost','btn-secondary');
    document.getElementById('tab-login').classList.replace('btn-secondary','btn-ghost');
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('otp-form').style.display = 'none';
  });

  // Handle role selection to show admin passcode
  document.querySelectorAll('input[name="reg-role"]').forEach(radio => {
    radio.addEventListener('change', function() {
      const passGroup = document.getElementById('admin-passcode-group');
      if (this.value === 'admin') {
        passGroup.classList.remove('hidden');
      } else {
        passGroup.classList.add('hidden');
      }
    });
  });

  // ── Login Form ─────────────────────────────────
  document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl  = document.getElementById('login-error');
    const btn      = document.getElementById('login-btn');

    btn.innerHTML = '<span class="spinner"></span><span>Signing in...</span>';
    btn.disabled = true;

    try {
      const result = await Auth.login(email, password);
      if (result.ok) {
        showApp();
        UI.toast(`Welcome back, ${Auth.getName().split(' ')[0]}! \uD83D\uDC4B`, 'success');
        btn.innerHTML = '<span>Sign In</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
        btn.disabled = false;
      } else {
        errorEl.textContent = result.error;
        errorEl.classList.remove('hidden');
        btn.innerHTML = '<span>Sign In</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
        btn.disabled = false;
      }
    } catch(err) {
      errorEl.textContent = "Sign in error: " + err.message;
      errorEl.classList.remove('hidden');
      btn.disabled = false;
      btn.innerHTML = '<span>Sign In</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    }
  });

  // ── OTP & Registration Flows ───────────────────
  let pendingOtpEmail = null;

  document.getElementById('send-otp-btn')?.addEventListener('click', async function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const errorEl = document.getElementById('login-error');
    if (!email) {
      errorEl.textContent = 'Please enter your email address first.';
      errorEl.classList.remove('hidden');
      return;
    }
    const btn = document.getElementById('login-btn');
    btn.innerHTML = '<span class="spinner"></span><span>Sending OTP...</span>';
    btn.disabled = true;

    const res = await Auth.sendOtp(email);
    if (res.ok) {
      pendingOtpEmail = email;
      document.getElementById('login-form').style.display = 'none';
      document.getElementById('otp-form').style.display = 'block';
      document.getElementById('auth-tabs').style.display = 'none';
      UI.toast('Please check your email for the code.', 'info');
    } else {
      errorEl.textContent = res.error;
      errorEl.classList.remove('hidden');
    }
    btn.innerHTML = '<span>Sign In</span>';
    btn.disabled = false;
  });

  document.getElementById('register-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const firstName = document.getElementById('reg-first').value.trim();
    const lastName = document.getElementById('reg-last').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const whatsappNumber = document.getElementById('reg-phone').value.trim();
    const role = document.querySelector('input[name="reg-role"]:checked').value;
    const adminPass = document.getElementById('reg-admin-pass').value;
    
    if (role === 'admin' && adminPass !== 'DAR_ADMIN_2026') {
      document.getElementById('reg-error').textContent = "Invalid Manager Passcode";
      document.getElementById('reg-error').classList.remove('hidden');
      return;
    }
    
    const btn = document.getElementById('reg-btn');
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;
    
    const res = await Auth.register({ firstName, lastName, email, password, whatsappNumber, role });
    if (res.ok) {
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('tab-login').classList.replace('btn-ghost','btn-secondary');
        document.getElementById('tab-register').classList.replace('btn-secondary','btn-ghost');
        
        UI.toast('Account created successfully! You can now sign in.', 'success');
        document.getElementById('login-email').value = email;
        document.getElementById('login-password').value = password;
    } else {
        document.getElementById('reg-error').textContent = res.error;
        document.getElementById('reg-error').classList.remove('hidden');
    }
    btn.innerHTML = 'Create Account';
    btn.disabled = false;
  });

  document.getElementById('otp-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const code = document.getElementById('otp-code').value.trim();
    if (!code || !pendingOtpEmail) return;

    const btn = document.getElementById('verify-otp-btn');
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;

    const res = await Auth.verifyOtp(pendingOtpEmail, code);
    if (res.ok) {
       showApp();
       UI.toast(`Welcome, ${Auth.getName().split(' ')[0]}! \uD83D\uDC4B`, 'success');
    } else {
       document.getElementById('otp-error').textContent = res.error;
       document.getElementById('otp-error').classList.remove('hidden');
    }
    btn.innerHTML = 'Verify & Connect';
    btn.disabled = false;
  });

  document.getElementById('back-to-login')?.addEventListener('click', function() {
    document.getElementById('otp-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('auth-tabs').style.display = 'flex';
    document.getElementById('demo-accounts-wrap').style.display = 'block';
  });

  // ── Demo Account Quick-Login ───────────────────
  document.querySelectorAll('.demo-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.getElementById('login-email').value    = this.dataset.email;
      document.getElementById('login-password').value = this.dataset.pass;
      document.getElementById('login-error').classList.add('hidden');
    });
  });

  // ── Logout ────────────────────────────────────
  document.getElementById('logout-btn').addEventListener('click', async function() {
    await Auth.logout();
    Router.currentPage = null;
    showLogin();
    document.getElementById('login-email').value    = '';
    document.getElementById('login-password').value = '';
    UI.toast('You have been signed out.', 'info');
    if (window.AI) window.AI.hide();
  });

  // ── Sidebar Toggle ─────────────────────────────
  document.getElementById('sidebar-toggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });

  // ── Mobile Menu ────────────────────────────────
  document.getElementById('mobile-menu-btn').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('mobile-open');
  });

  // ── Notifications Dropdown ─────────────────────
  const notifBtn = document.getElementById('notif-btn');
  const notifDropdown = document.getElementById('notif-dropdown');
  notifBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    notifDropdown.classList.toggle('hidden');
    if (!notifDropdown.classList.contains('hidden')) {
      UI.renderNotifications();
    }
  });
  document.addEventListener('click', function(e) {
    if (!notifDropdown.contains(e.target) && e.target !== notifBtn) {
      notifDropdown.classList.add('hidden');
    }
  });
  document.getElementById('mark-all-read').addEventListener('click', async function() {
    await DB.markNotificationsRead();
    UI.renderNotifications();
    UI.toast('All notifications marked as read.', 'info');
  });

  // ── Modal Close ────────────────────────────────
  document.getElementById('modal-close').addEventListener('click', UI.closeModal.bind(UI));
  document.getElementById('modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) UI.closeModal();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') UI.closeModal();
  });

  console.log('%c🌙 Dar Al-Arqam Academy / أكاديمية دار الأرقم', 'color:#C9A84C;font-size:16px;font-weight:bold');
  console.log('%cLoaded successfully. DB:', 'color:#4ECDC4', DB);
})();
