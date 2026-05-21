/* ================================================
   ADMIN DASHBOARD PAGE
   ================================================ */
Router.register('admin-dashboard', function(container) {
  try {
    const stats = DB.getDashboardStats();
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = DB.getSessions({ date: today });
    const pendingUsers = DB._data.users.filter(u => u.approval_status === 'pending');

  container.innerHTML = `
    <!-- Welcome Banner -->
    <div class="dashboard-welcome">
      <div>
        <p class="welcome-greeting">${t('Good')} ${t(getTimeOfDay())}, ${t('Admin')}</p>
        <h2 class="welcome-name">${t('Welcome back')}, <span>${Auth.getName().split(' ')[0]}</span></h2>
        <p class="welcome-time">${new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
      </div>
      <div class="welcome-stats">
        <div class="welcome-stat-item">
          <div class="welcome-stat-value">${todaySessions.length}</div>
          <div class="welcome-stat-label">Sessions Today</div>
        </div>
        <div class="welcome-stat-item">
          <div class="welcome-stat-value">${stats.pendingPayments}</div>
          <div class="welcome-stat-label">Pending Payments</div>
        </div>
        <div class="welcome-stat-item">
          <div class="welcome-stat-value">${stats.growthRate}%</div>
          <div class="welcome-stat-label">Growth Rate</div>
        </div>
      </div>
    </div>

    ${renderPendingApprovals(pendingUsers)}

    <!-- KPI Stats -->
    <div class="stats-grid">
      ${statCard('gold', svgUsers(), t('Active Students'), stats.activeStudents, '+8 this month', 'up')}
      ${statCard('teal', svgTeacher(), t('Teachers'), stats.activeTeachers, 'All active', 'up')}
      ${statCard('green', svgCheck(), t('Sessions Done'), stats.completedSessions, 'This period', 'neutral')}
      ${statCard('blue', svgCalendar(), t('Upcoming Sessions'), stats.upcomingSessions, 'Next 30 days', 'neutral')}
      ${statCard('gold', svgDollar(), t('Monthly Revenue'), UI.fmt.currency(stats.monthRevenue), `+${stats.growthRate}% vs last month`, 'up')}
      ${statCard('red', svgExpense(), t('Expenses'), UI.fmt.currency(stats.monthExpenses), 'Teacher fees + ops', 'neutral')}
    </div>

    <!-- Charts Row -->
    <div class="dash-grid-3" style="margin-bottom:var(--space-6)">
      <!-- Revenue Chart -->
      <div class="content-card">
        <div class="card-header">
          <span class="card-title">${svgChart()} ${t('Monthly Revenue')}</span>
          <span class="badge badge-success">+${stats.growthRate}%</span>
        </div>
        <div class="card-body">
          <div class="revenue-chart-area" id="rev-chart">
            ${stats.revenueByMonth.map(m => {
              const maxRev = Math.max(...stats.revenueByMonth.map(x => x.revenue), 1);
              const h = Math.round((m.revenue / maxRev) * 140);
              return `<div class="rev-bar-wrap">
                <div class="rev-bar chart-bar-gold" style="height:${h}px" data-value="${UI.fmt.currency(m.revenue)}"></div>
                <span class="rev-label">${m.month}</span>
              </div>`;
            }).join('')}
          </div>
          <div class="chart-legend" style="margin-top:var(--space-3)">
            <div class="legend-item"><div class="legend-dot" style="background:var(--gold-300)"></div><span class="legend-text">Revenue (USD)</span></div>
          </div>
        </div>
      </div>
      <!-- Attendance Rate -->
      <div class="content-card">
        <div class="card-header">
          <span class="card-title">${svgAttendance()} ${t('Attendance Rate')}</span>
        </div>
        <div class="card-body">
          <div class="gauge-wrap">
            ${UI.donutChart(stats.attendanceRate)}
          </div>
          <div style="margin-top:var(--space-3)">
            <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-1)">
              <span>${t('Overall attendance')}</span><span>${stats.attendanceRate}%</span>
            </div>
            <div class="progress-bar-wrap"><div class="progress-bar-fill progress-gold" style="width:${stats.attendanceRate}%"></div></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Row -->
    <div class="dash-grid-2">
      <!-- Today's Sessions -->
      <div class="content-card">
        <div class="card-header">
          <span class="card-title">${svgCalendar()} ${t("Today's Sessions")}</span>
          <span class="badge badge-${todaySessions.length > 0 ? 'gold' : 'gray'}">${todaySessions.length} sessions</span>
        </div>
        <div class="card-body" id="today-sessions-list">
          ${renderTodaySessions(todaySessions)}
        </div>
      </div>

      <!-- Marketing Performance -->
      <div class="content-card">
        <div class="card-header">
          <span class="card-title">📣 ${t('Marketing Performance')}</span>
          <button class="btn btn-ghost btn-sm" onclick="Router.navigate('admin-communications')">${t('View All')}</button>
        </div>
        <div class="card-body">
          <div class="marketing-table">
            ${renderMarketingRows()}
          </div>
          <div style="margin-top:var(--space-5);padding-top:var(--space-4);border-top:1px solid var(--border)">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-size:var(--text-sm);color:var(--text-muted)">Churn Rate</div>
                <div style="font-size:var(--text-xl);font-weight:800;color:var(--danger)">${stats.churnRate}%</div>
              </div>
              <div>
                <div style="font-size:var(--text-sm);color:var(--text-muted)">Net Profit</div>
                <div style="font-size:var(--text-xl);font-weight:800;color:var(--success)">${UI.fmt.currency(stats.profit)}</div>
              </div>
              <div>
                <div style="font-size:var(--text-sm);color:var(--text-muted)">Growth</div>
                <div style="font-size:var(--text-xl);font-weight:800;color:var(--gold-300)">${stats.growthRate}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Enrollments -->
    <div class="content-card" style="margin-top:var(--space-6)">
      <div class="card-header">
        <span class="card-title">🎓 ${t('Recent Enrollments')}</span>
        <button class="btn btn-secondary btn-sm" onclick="Router.navigate('admin-students')">${t('View All Students')}</button>
      </div>
      <div class="card-body-flush">
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr>
              <th>${t('Student')}</th><th>${t('Code')}</th><th>${t('Family')}</th><th>${t('Courses')}</th><th>${t('Status')}</th><th>${t('Joined')}</th>
            </tr></thead>
            <tbody>
              ${DB.getStudents().slice(0,6).map(s => {
                const family = DB.getFamily(s.familyId);
                return `<tr>
                  <td><div style="display:flex;align-items:center;gap:var(--space-3)">
                    ${UI.avatar(s.name, 'avatar avatar-sm')}
                    <span style="font-weight:600">${s.name}</span>
                  </div></td>
                  <td><code style="font-size:11px;color:var(--gold-300)">${s.id}</code></td>
                  <td style="color:var(--text-secondary)">${family ? family.name : '—'}</td>
                  <td>${s.courses.map(c => `<span class="badge badge-${UI.fmt.courseColor(c)}">${c}</span>`).join(' ')}</td>
                  <td>${UI.badge(s.status === 'active' ? 'Active' : 'Inactive', s.status === 'active' ? 'success' : 'danger')}</td>
                  <td style="color:var(--text-muted)">${UI.fmt.date(s.joinDate)}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Attendance Tracking and Activity Feed -->
    <div class="dash-grid-2" style="margin-top:var(--space-6)">
      <!-- Attendance Tracking Table -->
      <div class="content-card">
        <div class="card-header">
          <span class="card-title">📝 ${t('Recent Attendance')}</span>
        </div>
        <div class="card-body-flush">
          <div class="table-wrapper">
            <table class="data-table">
              <thead><tr><th>${t('Student')}</th><th>${t('Session')}</th><th>${t('Status')}</th><th>${t('Date')}</th></tr></thead>
              <tbody>
                ${renderRecentAttendance()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Recent Activity Feed -->
      <div class="content-card">
        <div class="card-header">
          <span class="card-title">⚡ ${t('Recent Activity')}</span>
        </div>
        <div class="card-body-flush">
          <div style="padding:0 var(--space-4)">
            ${renderRecentActivity()}
          </div>
        </div>
      </div>
    </div>
  `;
  } catch(e) {
    container.innerHTML = `<div class="error-text" style="padding: 20px; color: red;"><h3>Dashboard Error:</h3><pre>${e.message}\n${e.stack}</pre></div>`;
  }
});

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function statCard(color, icon, label, value, change, trend) {
  return `<div class="stat-card ${color}">
    <div class="stat-card-icon">${icon}</div>
    <div class="stat-label">${label}</div>
    <div class="stat-value">${value}</div>
    <div class="stat-change ${trend}">${trend === 'up' ? '↑' : trend === 'down' ? '↓' : '·'} ${change}</div>
  </div>`;
}

function renderTodaySessions(sessions) {
  if (!sessions.length) return `<div class="empty-state" style="padding:var(--space-8)">
    <div class="empty-state-icon">📅</div>
    <p class="empty-state-title">No sessions today</p>
  </div>`;
  return sessions.slice(0,5).map(s => {
    const teacher = DB.getTeacher(s.teacherId);
    const accessible = UI.fmt.isZoomAccessible(s.date, s.time);
    return `<div class="session-card">
      <div class="session-time-block">
        <div class="session-time">${UI.fmt.time(s.time)}</div>
        <div class="session-duration">${s.duration}m</div>
      </div>
      <div class="session-divider"></div>
      <div class="session-info">
        <div class="session-title">${s.courseType} — ${s.studentIds.length} student(s)</div>
        <div class="session-meta">👨‍🏫 ${teacher ? teacher.name : 'Unknown'}</div>
      </div>
      <span class="badge badge-${UI.fmt.courseColor(s.courseType)}">${s.courseType}</span>
    </div>`;
  }).join('');
}

function renderMarketingRows() {
  const channels = [
    { name: '📘 Facebook Ads',  leads: 48, cost: '$320', conv: 62 },
    { name: '📸 Instagram',     leads: 36, cost: '$180', conv: 44 },
    { name: '🔍 Google Ads',    leads: 22, cost: '$240', conv: 31 },
    { name: '📨 Email Campaign',leads: 15, cost: '$40',  conv: 53 },
    { name: '🤝 Referrals',     leads: 29, cost: '$0',   conv: 79 },
  ];
  return channels.map(c => `
    <div class="mkt-row">
      <span class="mkt-channel">${c.name}</span>
      <span class="mkt-leads">${c.leads} leads</span>
      <span class="mkt-cost">${c.cost}</span>
      <div class="mkt-conv">
        <div style="display:flex;align-items:center;gap:4px">
          <div class="progress-bar-wrap" style="flex:1"><div class="progress-bar-fill progress-teal" style="width:${c.conv}%"></div></div>
          <span style="font-size:10px;color:var(--teal-300);font-weight:700;min-width:28px">${c.conv}%</span>
        </div>
      </div>
    </div>`).join('');
}

// SVG icons
function svgUsers()      { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'; }
function svgTeacher()    { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'; }
function svgCheck()      { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'; }
function svgCalendar()   { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'; }
function svgDollar()     { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'; }
function svgExpense()    { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>'; }
function svgChart()      { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'; }
function svgAttendance() { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>'; }

function renderRecentAttendance() {
  const attendance = DB.getAttendance().slice(-5).reverse();
  if (!attendance.length) return '<tr><td colspan="4"><div class="empty-state" style="padding:var(--space-6)"><p>No attendance records</p></div></td></tr>';
  
  return attendance.map(a => {
    const student = DB.getStudent(a.studentId);
    const session = DB.getSession(a.sessionId);
    const [sl, sc] = UI.fmt.attendanceStatus(a.status);
    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:var(--space-2)">
          ${UI.avatar(student ? student.name : '?', 'avatar avatar-sm')}
          <span style="font-weight:600;font-size:var(--text-sm)">${student ? student.name.split(' ')[0] : 'Unknown'}</span>
        </div>
      </td>
      <td><span class="badge badge-${session ? UI.fmt.courseColor(session.courseType) : 'gray'}">${session ? session.courseType : '—'}</span></td>
      <td>${UI.badge(sl, sc)}</td>
      <td style="font-size:var(--text-xs);color:var(--text-muted)">${session ? UI.fmt.dateShort(session.date) : '—'}</td>
    </tr>`;
  }).join('');
}

function renderRecentActivity() {
  const notifs = DB.getNotifications().slice(0, 5);
  if (!notifs.length) return '<div class="empty-state" style="padding:var(--space-8)"><p>No recent activity</p></div>';
  
  return notifs.map((n, i) => {
    const icons = {
      reminder: { icon: '⏰', color: 'rgba(52,152,219,0.1)' },
      enrollment: { icon: '🎓', color: 'rgba(46,204,113,0.1)' },
      payment: { icon: '💳', color: 'rgba(201,168,76,0.1)' },
      absence: { icon: '⚠️', color: 'rgba(231,76,60,0.1)' },
      announcement: { icon: '📢', color: 'rgba(255,255,255,0.05)' }
    };
    const style = icons[n.type] || icons.announcement;
    const isLast = i === notifs.length - 1;
    
    return `
      <div style="display:flex;gap:var(--space-3);padding:var(--space-3) 0;border-bottom:${isLast ? 'none' : '1px solid var(--border)'}">
        <div style="width:36px;height:36px;border-radius:var(--radius-full);background:${style.color};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">
          ${style.icon}
        </div>
        <div>
          <div style="font-weight:600;font-size:var(--text-sm);margin-bottom:2px">${n.title}</div>
          <div style="color:var(--text-secondary);font-size:var(--text-xs);margin-bottom:4px;line-height:1.4">${n.body}</div>
          <div style="color:var(--text-muted);font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:0.04em">${n.time}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderPendingApprovals(users) {
  if (!users.length) return '';
  return `
    <div class="content-card" style="margin-top:var(--space-6); border: 1px solid var(--gold-300);">
      <div class="card-header" style="background: rgba(201,168,76,0.05);">
        <span class="card-title">⚠️ ${t ? t('Pending Approvals') : 'Pending Approvals'}</span>
        <span class="badge badge-warning">${users.length} pending</span>
      </div>
      <div class="card-body-flush">
        <ul style="list-style:none; padding:var(--space-2) 0; margin:0;">
          ${users.map(u => `
            <li style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-3) var(--space-4); border-bottom:1px solid var(--border)">
               <div>
                 <div style="font-weight:bold">${u.name}</div>
                 <div style="font-size:12px; color:var(--text-muted)">${u.email} — Role: <strong>${u.role}</strong></div>
               </div>
               <button class="btn btn-primary btn-sm" onclick="approveUser('${u.id}')">Approve</button>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `;
}

window.approveUser = function(id) {
    UI.confirm("Are you sure you want to approve this user?", async () => {
      const { error } = await supabaseClient.from('user_profiles').update({ approval_status: 'approved' }).eq('id', id);
      if(error){
          UI.toast('Failed to approve: ' + error.message, 'error');
          return;
      }
      UI.toast('User approved successfully!', 'success');
      await DB.loadState();
      Router.navigate('admin-dashboard', true);
    });
};
