/* ================================================
   ADMIN COMMUNICATIONS PAGE
   ================================================ */
Router.register('admin-communications', function(container) {
  renderCommunicationsPage(container);
});

function renderCommunicationsPage(container) {
  const notifs = DB.getNotifications();
  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">${window.t?window.t('Communication Center'):'Communication Center'}</h2>
        <p class="section-subtitle">${window.t?window.t('Automated notifications, templates, and delivery logs'):'Automated notifications, templates, and delivery logs'}</p>
      </div>
      <button class="btn btn-primary" onclick="openSendNotifModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        ${window.t?window.t('Send Notification'):'Send Notification'}
      </button>
    </div>

    <!-- Channel Stats -->
    <div class="stats-grid" style="margin-bottom:var(--space-6)">
      <div class="stat-card blue" style="padding:var(--space-4) var(--space-5)">
        <div class="stat-card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg></div>
        <div class="stat-label">${window.t?window.t('Emails Sent'):'Emails Sent'}</div>
        <div class="stat-value">1,248</div>
        <div class="stat-change up">↑ 94.2% ${window.t?window.t('open rate'):'open rate'}</div>
      </div>
      <div class="stat-card green" style="padding:var(--space-4) var(--space-5)">
        <div class="stat-card-icon">📱</div>
        <div class="stat-label">${window.t?window.t('SMS Sent'):'SMS Sent'}</div>
        <div class="stat-value">386</div>
        <div class="stat-change up">↑ 98.1% ${window.t?window.t('delivered'):'delivered'}</div>
      </div>
      <div class="stat-card gold" style="padding:var(--space-4) var(--space-5)">
        <div class="stat-card-icon">🔔</div>
        <div class="stat-label">${window.t?window.t('In-App Alerts'):'In-App Alerts'}</div>
        <div class="stat-value">2,041</div>
        <div class="stat-change neutral">· ${window.t?window.t('All portals'):'All portals'}</div>
      </div>
      <div class="stat-card teal" style="padding:var(--space-4) var(--space-5)">
        <div class="stat-card-icon">✅</div>
        <div class="stat-label">${window.t?window.t('Delivery Rate'):'Delivery Rate'}</div>
        <div class="stat-value">96.8%</div>
        <div class="stat-change up">↑ ${window.t?window.t('Industry leading'):'Industry leading'}</div>
      </div>
    </div>

    <div class="dash-grid-2">
      <!-- Notification Templates -->
      <div class="content-card">
        <div class="card-header">
          <span class="card-title">📋 ${window.t?window.t('Auto-Notification Templates'):'Auto-Notification Templates'}</span>
          <button class="btn btn-ghost btn-sm" onclick="UI.toast(window.t?window.t('Template editor coming in Phase 3'):'Template editor coming in Phase 3','info')">${window.t?window.t('Edit Templates'):'Edit Templates'}</button>
        </div>
        <div class="card-body">
          ${renderTemplates()}
        </div>
      </div>

      <!-- Recent Notifications -->
      <div class="content-card">
        <div class="card-header">
          <span class="card-title">🕐 ${window.t?window.t('Recent Notifications'):'Recent Notifications'}</span>
          <span class="badge badge-${notifs.filter(n=>!n.read).length > 0 ? 'danger' : 'gray'}">${notifs.filter(n=>!n.read).length} ${window.t?window.t('unread'):'unread'}</span>
        </div>
        <div class="card-body-flush">
          ${notifs.slice(0,8).map(n => `
            <div class="notif-item${n.read ? '' : ' unread'}">
              <div class="notif-item-title">${n.title}</div>
              <div class="notif-item-body">${n.body}</div>
              <div class="notif-item-time">${n.time}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- Notification Log Table -->
    <div class="content-card" style="margin-top:var(--space-6)">
      <div class="card-header">
        <span class="card-title">📬 ${window.t?window.t('Notification Log'):'Notification Log'}</span>
        <select class="form-input-plain" style="height:36px;width:auto">
          <option>${window.t?window.t('All Types'):'All Types'}</option>
          <option>${window.t?window.t('Session Reminder'):'Session Reminder'}</option>
          <option>${window.t?window.t('Payment'):'Payment'}</option>
          <option>${window.t?window.t('Absence'):'Absence'}</option>
          <option>${window.t?window.t('Cancellation'):'Cancellation'}</option>
        </select>
      </div>
      <div class="card-body-flush">
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>${window.t?window.t('Recipient'):'Recipient'}</th><th>${window.t?window.t('Type'):'Type'}</th><th>${window.t?window.t('Message'):'Message'}</th><th>${window.t?window.t('Channel'):'Channel'}</th><th>${window.t?window.t('Sent'):'Sent'}</th><th>${window.t?window.t('Status'):'Status'}</th></tr></thead>
            <tbody>${renderNotifLog()}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderTemplates() {
  const templates = [
    { type: '⏰ Session Reminder (24h)', desc: 'Sent 24 hours before each scheduled session. Includes session details and Zoom link.', channels: ['email','in-app'], active: true },
    { type: '⚡ Session Reminder (5 min)', desc: 'Sent 5 minutes before session start. Includes the live Zoom join link.', channels: ['sms','in-app'], active: true },
    { type: '❌ Session Cancellation', desc: 'Triggered when a session is cancelled. Notifies teacher and all enrolled students.', channels: ['email','sms','in-app'], active: true },
    { type: '💳 Payment Reminder', desc: 'Sent 3 days before monthly billing date. Sent again on overdue after 7 days.', channels: ['email','sms'], active: true },
    { type: '🚫 Absence Alert', desc: 'Alerts parents when a student is marked absent in a session.', channels: ['email','in-app'], active: true },
    { type: '🎉 Welcome Email', desc: 'Sent to new students/parents upon enrollment confirmation.', channels: ['email'], active: true },
  ];
  return templates.map(t => `
    <div class="notif-template-card">
      <div class="notif-template-header">
        <span class="notif-template-type">${t.type}</span>
        <span class="badge badge-${t.active ? 'success' : 'danger'}">${t.active ? 'Active' : 'Off'}</span>
      </div>
      <div class="notif-template-body">${t.desc}</div>
      <div class="notif-template-channels">
        ${t.channels.map(c => `<span class="badge badge-${c==='email'?'info':c==='sms'?'success':'gold'}">${c==='email'?'📧 Email':c==='sms'?'📱 SMS':'🔔 In-App'}</span>`).join('')}
      </div>
    </div>`).join('');
}

function renderNotifLog() {
  const rows = [
    { recipient: 'Ibrahim Al-Farsi', type: 'Session Reminder', msg: 'Your Quran session starts in 24 hours', channel: 'email', sent: '2h ago', status: 'delivered' },
    { recipient: 'Al-Farsi Family',  type: 'Payment Reminder', msg: 'April subscription due in 3 days', channel: 'email', sent: '1d ago', status: 'delivered' },
    { recipient: 'Omar Khalid',      type: 'Absence Alert',   msg: 'Omar was marked absent today', channel: 'in-app', sent: '2d ago', status: 'read' },
    { recipient: 'Aisha Rahman',     type: 'Session Reminder', msg: 'Fiqh session in 5 minutes — join now', channel: 'sms', sent: '3d ago', status: 'delivered' },
    { recipient: 'Yusuf Hassan',     type: 'Welcome',         msg: 'Welcome to Dar Al-Arqam Academy!', channel: 'email', sent: '5d ago', status: 'opened' },
    { recipient: 'Hassan Family',    type: 'Payment Received', msg: 'Payment of $420 confirmed for April', channel: 'email', sent: '1w ago', status: 'delivered' },
  ];
  const channelIcons = { email: '📧', sms: '📱', 'in-app': '🔔' };
  const statusBadges = { delivered: 'success', read: 'teal', opened: 'info', failed: 'danger' };
  return rows.map(r => `<tr>
    <td style="font-weight:600;font-size:var(--text-sm)">${r.recipient}</td>
    <td><span class="badge badge-gold" style="font-size:10px">${window.t?window.t(r.type):r.type}</span></td>
    <td style="color:var(--text-secondary);font-size:var(--text-xs);max-width:200px">${window.t?window.t(r.msg):r.msg}</td>
    <td>${channelIcons[r.channel]||''} <span style="font-size:var(--text-xs)">${r.channel}</span></td>
    <td style="color:var(--text-muted);font-size:var(--text-xs)">${r.sent}</td>
    <td>${UI.badge(window.t?window.t(r.status):r.status, statusBadges[r.status]||'gray')}</td>
  </tr>`).join('');
}

window.openSendNotifModal = function() {
  const students = DB.getStudents({ status: 'active' });
  const families = DB.getFamilies({ status: 'active' });
  UI.openModal('Send Notification', `
    <div class="form-group">
      <label class="form-label">Recipients</label>
      <select class="form-input-plain" id="notif-recipients">
        <option value="all">All Students & Parents</option>
        <option value="students">All Students</option>
        <option value="parents">All Parents</option>
        <option value="teachers">All Teachers</option>
        ${students.map(s => `<option value="student-${s.id}">${s.name} (Student)</option>`).join('')}
        ${families.map(f => `<option value="family-${f.id}">${f.name} (Family)</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Notification Type</label>
      <select class="form-input-plain" id="notif-type">
        <option value="announcement">📢 Announcement</option>
        <option value="reminder">⏰ Reminder</option>
        <option value="alert">🚨 Alert</option>
        <option value="payment">💳 Payment</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Title</label>
      <input type="text" class="form-input-plain" id="notif-title" placeholder="Notification title..." />
    </div>
    <div class="form-group">
      <label class="form-label">Message</label>
      <textarea class="form-input-plain" id="notif-body" placeholder="Write your message here..." style="min-height:100px"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Delivery Channels</label>
      <div class="channel-pills">
        <button class="channel-pill active email" id="ch-email" onclick="toggleChannel('email')">📧 Email</button>
        <button class="channel-pill active in-app" id="ch-inapp" onclick="toggleChannel('in-app')">🔔 In-App</button>
        <button class="channel-pill sms" id="ch-sms" onclick="toggleChannel('sms')">📱 SMS (Phase 3)</button>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="sendNotification()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        Send Now
      </button>
    </div>
  `);
};

window.toggleChannel = function(ch) {
  const btn = document.getElementById(`ch-${ch === 'in-app' ? 'inapp' : ch}`);
  if (!btn) return;
  btn.classList.toggle('active');
  btn.classList.toggle(ch);
};

window.sendNotification = function() {
  const title = document.getElementById('notif-title')?.value.trim();
  const body  = document.getElementById('notif-body')?.value.trim();
  if (!title || !body) { UI.toast('Title and message are required.', 'error'); return; }
  DB.addNotification({ title, body, type: document.getElementById('notif-type')?.value || 'announcement' });
  UI.renderNotifications();
  UI.closeModal();
  UI.toast('Notification sent to recipients!', 'success');
};
