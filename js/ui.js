/* ================================================
   UI.JS — Shared UI Utilities
   ================================================ */
'use strict';

const UI = {
  // ── Toast Notifications ──
  toast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span style="font-size:16px;font-weight:700">${icons[type]||'·'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // ── Modal ──
  openModal(title, bodyHTML, wide = false) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    const overlay = document.getElementById('modal-overlay');
    const modal   = document.getElementById('modal-container');
    overlay.classList.remove('hidden');
    if (wide) modal.style.maxWidth = '720px';
    else modal.style.maxWidth = '560px';
    document.body.style.overflow = 'hidden';
  },
  closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.body.style.overflow = '';
  },

  // ── Render helpers ──
  el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  },

  // ── Format helpers ──
  fmt: {
    date(str) {
      if (!str) return '—';
      return new Date(str + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    },
    dateShort(str) {
      if (!str) return '—';
      return new Date(str + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    },
    time(str) {
      if (!str) return '—';
      const [h, m] = str.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
    },
    currency(n) { return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0 })}`; },
    month(str) {
      if (!str) return '—';
      const [y, m] = str.split('-');
      return new Date(+y, +m - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    },
    duration(min) { return `${min} min`; },
    initials(name) { return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase(); },
    attendanceStatus(s) {
      const map = { present: ['Present','success'], absent: ['Absent','danger'], late: ['Late','warning'] };
      return map[s] || [s, 'gray'];
    },
    sessionStatus(s) {
      const map = { completed: ['Completed','teal'], upcoming: ['Upcoming','gold'], cancelled: ['Cancelled','danger'], postponed: ['Postponed','warning'] };
      return map[s] || [s, 'gray'];
    },
    courseColor(type) {
      const map = { Quran: 'quran', Arabic: 'arabic', Fiqh: 'fiqh' };
      return map[type] || 'gray';
    },
    recurrence(r) {
      const map = { once: 'One-time', weekly: 'Weekly', biweekly: 'Bi-weekly' };
      return map[r] || r;
    },
    timeUntil(dateStr, timeStr) {
      const target = new Date(`${dateStr}T${timeStr}:00`);
      const now = new Date();
      const diff = target - now;
      if (diff < 0) return null;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (h > 48) return `${Math.floor(h/24)}d ${h%24}h`;
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m`;
    },
    countdown(dateStr, timeStr) {
      const target = new Date(`${dateStr}T${timeStr}:00`);
      const now = new Date();
      const diff = target - now;
      if (diff < 0) return { past: true, text: 'Session ended' };
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      return { past: false, text: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` };
    },
    isZoomAccessible(dateStr, timeStr) {
      const target = new Date(`${dateStr}T${timeStr}:00`);
      const now = new Date();
      const diff = target - now;
      return diff <= 15 * 60000; // 15 minutes
    }
  },

  // ── Avatar ──
  avatar(name, cls = 'avatar') {
    const initials = UI.fmt.initials(name);
    const colors = ['gold','teal', 'blue', 'purple', 'green', 'red'];
    const idx = name.charCodeAt(0) % colors.length;
    const grads = {
      gold: 'var(--grad-gold)', teal: 'var(--grad-teal)',
      blue: 'var(--grad-blue)', purple: 'var(--grad-purple)',
      green: 'var(--grad-success)', red: 'var(--grad-danger)'
    };
    return `<div class="${cls}" style="background:${grads[colors[idx]]}">${initials}</div>`;
  },

  // ── Badge ──
  badge(text, type) { return `<span class="badge badge-${type}">${text}</span>`; },

  // ── Role Badge ──
  roleBadge(role) {
    const icons = { admin: '👑', teacher: '👨‍🏫', student: '🎓', parent: '👨‍👩‍👧' };
    return `<span class="role-badge role-${role}">${icons[role]||''} ${role}</span>`;
  },

  // ── Set page title ──
  setPageTitle(title) {
    const el = document.getElementById('page-title');
    if (el) el.textContent = window.t ? window.t(title) : title;
  },

  // ── Confirm dialog ──
  confirm(message, onConfirm) {
    UI.openModal('Confirm Action', `
      <p style="color:var(--text-secondary);margin-bottom:var(--space-6)">${message}</p>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
        <button class="btn btn-danger" id="confirm-yes-btn">Confirm</button>
      </div>
    `);
    document.getElementById('confirm-yes-btn').onclick = () => {
      UI.closeModal();
      onConfirm();
    };
  },

  // ── Loading state ──
  loading(container) {
    if (typeof container === 'string') container = document.getElementById(container);
    if (!container) return;
    container.innerHTML = `
      <div class="empty-state">
        <div class="spinner" style="width:32px;height:32px;margin-bottom:var(--space-4)"></div>
        <p style="color:var(--text-muted);font-size:var(--text-sm)">Loading...</p>
      </div>`;
  },

  // ── Update header date ──
  updateHeaderDate() {
    const el = document.getElementById('header-date');
    if (el) {
      const locale = (window.I18N && window.I18N.currentLang === 'ar') ? 'ar-EG' : 'en-GB';
      el.textContent = new Date().toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    }
  },

  // ── Donut Chart (SVG) ──
  donutChart(pct, color = '#C9A84C', size = 120, stroke = 12) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const fill = (pct / 100) * circ;
    return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="gauge-svg">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="${stroke}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
        stroke-dasharray="${fill} ${circ - fill}"
        stroke-dashoffset="${circ / 4}"
        stroke-linecap="round"
        style="transition:stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)"/>
      <text x="${size/2}" y="${size/2 + 6}" class="gauge-value" font-family="Inter,sans-serif" font-size="22" font-weight="900" fill="var(--text-primary)" text-anchor="middle">${pct}%</text>
      <text x="${size/2}" y="${size/2 + 22}" class="gauge-label" font-family="Inter,sans-serif" font-size="11" fill="var(--text-muted)" text-anchor="middle">${window.t ? window.t('Rate') : 'Rate'}</text>
    </svg>`;
  },

  // ── Sparkline SVG ──
  sparkline(data, color = '#C9A84C', height = 40) {
    if (!data.length) return '';
    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const w = 200;
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = height - ((v - min) / (max - min || 1)) * (height - 4) - 2;
      return `${x},${y}`;
    }).join(' ');
    const fillPts = `0,${height} ${pts} ${w},${height}`;
    return `<svg viewBox="0 0 ${w} ${height}" class="sparkline" preserveAspectRatio="none">
      <defs><linearGradient id="spgr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.3"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      <polyline fill="none" stroke="${color}" stroke-width="2" points="${pts}" stroke-linecap="round" stroke-linejoin="round"/>
      <polygon fill="url(#spgr)" points="${fillPts}"/>
    </svg>`;
  },

  // ── Render Notifications ──
  renderNotifications() {
    const notifs = DB.getNotifications();
    const unread = notifs.filter(n => !n.read).length;
    const badge = document.getElementById('notif-badge');
    if (badge) {
      badge.textContent = unread;
      badge.style.display = unread > 0 ? 'flex' : 'none';
    }
    const list = document.getElementById('notif-list');
    if (!list) return;
    if (notifs.length === 0) {
      list.innerHTML = `<div class="empty-state" style="padding:var(--space-8)"><p style="color:var(--text-muted)">${window.t ? window.t('No notifications') : 'No notifications'}</p></div>`;
      return;
    }
    list.innerHTML = notifs.slice(0, 8).map(n => `
      <div class="notif-item${n.read ? '' : ' unread'}">
        <div class="notif-item-title">${n.title}</div>
        <div class="notif-item-body">${n.body}</div>
        <div class="notif-item-time">${n.time}</div>
      </div>`).join('');
  }
};

window.UI = UI;
