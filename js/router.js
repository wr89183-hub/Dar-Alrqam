/* ================================================
   ROUTER.JS — Client-side routing & navigation
   ================================================ */
'use strict';

const NAV_CONFIG = {
  admin: [
    { section: 'Overview' },
    { id: 'admin-dashboard',      label: 'Dashboard',       icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
    { section: 'Management' },
    { id: 'admin-students',       label: 'Students',        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
    { id: 'admin-teachers',       label: 'Teachers',        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
    { id: 'admin-families',       label: 'Families',        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
    { section: 'Academic' },
    { id: 'admin-schedule',       label: 'Schedule',        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
    { section: 'Financial' },
    { id: 'admin-finance',        label: 'Finance',         icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
    { section: 'Communication' },
    { id: 'admin-communications', label: 'Notifications',   icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' },
  ],
  teacher: [
    { section: 'My Portal' },
    { id: 'teacher-dashboard',    label: 'Dashboard',       icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
    { id: 'teacher-sessions',     label: 'My Sessions',     icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
    { id: 'teacher-attendance',   label: 'Attendance',      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
  ],
  student: [
    { section: 'My Portal' },
    { id: 'student-dashboard',    label: 'Dashboard',       icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
    { id: 'student-schedule',     label: 'My Schedule',     icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
    { id: 'student-attendance',   label: 'My Attendance',   icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
  ],
  parent: [
    { section: 'Family Portal' },
    { id: 'parent-dashboard',     label: 'Overview',        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
    { id: 'parent-schedule',      label: 'Schedule',        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
    { id: 'parent-billing',       label: 'Billing',         icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
  ]
};

const Router = {
  currentPage: null,
  handlers: {},

  register(pageId, handler) {
    this.handlers[pageId] = handler;
  },

  navigate(pageId, forceRefresh = false) {
    if (this.currentPage === pageId && !forceRefresh) return;
    this.currentPage = pageId;

    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === pageId);
    });

    // Render page
    const content = document.getElementById('main-content');
    content.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'page-content page-enter';
    content.appendChild(div);

    if (this.handlers[pageId]) {
      this.handlers[pageId](div);
    } else {
      div.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🚧</div><p class="empty-state-title">Page Coming Soon</p></div>`;
    }

    // Update page title
    const role = Auth.getRole();
    const navItems = NAV_CONFIG[role] || [];
    const item = navItems.find(n => n.id === pageId);
    if (item) UI.setPageTitle(t(item.label));
  },

  buildSidebar() {
    const role = Auth.getRole();
    const nav = document.getElementById('sidebar-nav');
    const navItems = NAV_CONFIG[role] || [];
    nav.innerHTML = navItems.map(item => {
      if (item.section) {
        return `<div class="nav-section-label">${t(item.section)}</div>`;
      }
      return `<a class="nav-item" data-page="${item.id}" id="nav-${item.id}" href="#">${item.icon}<span class="nav-label">${t(item.label)}</span></a>`;
    }).join('');

    // Click handlers
    nav.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const page = el.dataset.page;
        Router.navigate(page);
        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('mobile-open');
      });
    });
  },

  getDefaultPage() {
    const defaults = { admin: 'admin-dashboard', teacher: 'teacher-dashboard', student: 'student-dashboard', parent: 'parent-dashboard' };
    return defaults[Auth.getRole()] || 'admin-dashboard';
  }
};

window.Router = Router;
window.NAV_CONFIG = NAV_CONFIG;
