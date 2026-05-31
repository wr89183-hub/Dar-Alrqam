/* ================================================
   ADMIN SCHEDULE PAGE — Full Calendar + Session Management
   + Smart Recurring Schedule System
   ================================================ */
let calendarState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
};

Router.register('admin-schedule', async function(container) {
  container.innerHTML = `<div class="empty-state">Loading schedule...</div>`;
  await DB.loadState();
  renderSchedulePage(container);
});

function renderSchedulePage(container) {
  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">${window.t?window.t('Schedule'):'Schedule'}</h2>
        <p class="section-subtitle">${window.t?window.t('Manage all sessions, recurrences, and calendar'):'Manage all sessions, recurrences, and calendar'}</p>
      </div>
      <div style="display:flex;gap:var(--space-3)">
        <button class="btn btn-secondary" id="view-list-btn" onclick="switchScheduleView('list')">📋 ${window.t?window.t('List View'):'List View'}</button>
        <button class="btn btn-primary" id="view-cal-btn" onclick="switchScheduleView('calendar')">📅 ${window.t?window.t('Calendar View'):'Calendar View'}</button>
        <button class="btn btn-primary" onclick="openSetScheduleModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          ${window.t?window.t('Set Schedule'):'Set Schedule'}
        </button>
      </div>
    </div>

    <!-- Course legend -->
    <div style="display:flex;gap:var(--space-4);margin-bottom:var(--space-5);flex-wrap:wrap">
      <div class="legend-item"><div class="legend-dot" style="background:#2ECC71"></div><span class="legend-text">Quran</span></div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--gold-300)"></div><span class="legend-text">Arabic</span></div>
      <div class="legend-item"><div class="legend-dot" style="background:#BB8FCE"></div><span class="legend-text">Fiqh</span></div>
      <div class="legend-item"><div class="legend-dot" style="background:#aaa;font-size:10px;display:flex;align-items:center;justify-content:center;color:#fff;border-radius:50%;">🔄</div><span class="legend-text">Recurring</span></div>
    </div>

    <div id="schedule-view-content"></div>
  `;

  switchScheduleView('calendar');
}

window.switchScheduleView = async function(view) {
  const content = document.getElementById('schedule-view-content');
  const listBtn = document.getElementById('view-list-btn');
  const calBtn  = document.getElementById('view-cal-btn');
  if (!content) return;

  await DB.loadState();

  if (view === 'calendar') {
    if (calBtn)  calBtn.className  = 'btn btn-primary';
    if (listBtn) listBtn.className = 'btn btn-secondary';
    renderCalendarView(content);
  } else {
    if (listBtn) listBtn.className = 'btn btn-primary';
    if (calBtn)  calBtn.className  = 'btn btn-secondary';
    renderListView(content);
  }
};

window.goToToday = async function() {
  const d = new Date();
  calendarState.year = d.getFullYear();
  calendarState.month = d.getMonth();
  const content = document.getElementById('schedule-view-content');
  if (content) { await DB.loadState(); renderCalendarView(content); }
};

window.prevMonth = async function() {
  calendarState.month--;
  if(calendarState.month < 0){ calendarState.month = 11; calendarState.year--; }
  await DB.loadState();
  renderCalendarView(document.getElementById('schedule-view-content'));
};

window.nextMonth = async function() {
  calendarState.month++;
  if(calendarState.month > 11){ calendarState.month = 0; calendarState.year++; }
  await DB.loadState();
  renderCalendarView(document.getElementById('schedule-view-content'));
};

/* ── Calendar View ── */
function renderCalendarView(container) {
  const year  = calendarState.year;
  const month = calendarState.month;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const monthSessions = DB.getSessions({ month: `${year}-${String(month+1).padStart(2,'0')}` });
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const byDate = {};
  monthSessions.forEach(s => {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  });

  const dayNames = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  let calHTML = `<div class="content-card" style="padding:var(--space-4);"><div class="calendar-wrap" style="background:#fff; border-radius:8px; border:1px solid #dadce0; overflow:hidden; color:#3c4043; font-family: 'Roboto', 'Inter', sans-serif;">
    <div class="calendar-nav" style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px; border-bottom:1px solid #dadce0;">
      <div style="display:flex;align-items:center;gap:12px;">
        <button class="btn btn-secondary btn-sm" onclick="goToToday()" style="background:#fff; color:#3c4043; border:1px solid #dadce0; font-weight:500;">${window.t?window.t('Today'):'Today'}</button>
        <div style="display:flex;align-items:center;gap:4px;">
          <button class="cal-nav-btn" onclick="prevMonth()" title="Previous Month" style="background:transparent; border:none; color:#5f6368; cursor:pointer; padding:4px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
          <button class="cal-nav-btn" onclick="nextMonth()" title="Next Month" style="background:transparent; border:none; color:#5f6368; cursor:pointer; padding:4px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>
        </div>
        <h3 class="cal-month-title" style="font-size:22px;font-weight:400;color:#3c4043;margin:0;margin-left:8px;">${monthNames[month]} ${year}</h3>
      </div>
    </div>
    
    <div style="overflow-x:auto;">
      <div class="calendar-grid" style="display:grid;grid-template-columns:repeat(7, 1fr);background:#dadce0;gap:1px;min-width:700px;">
        ${dayNames.map(d => `<div class="cal-day-header" style="background:#fff;text-align:center;font-weight:500;font-size:11px;color:#70757a;padding:10px 0;">${d}</div>`).join('')}
`;

  for (let i = 0; i < firstDay; i++) {
    calHTML += `<div class="cal-day other-month" style="background:#fff; min-height:120px;"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const daySessionsArr = byDate[dateStr] || [];
    daySessionsArr.sort((a,b) => a.time.localeCompare(b.time));

    let dayNumHTML = isToday
      ? `<div style="background:#1a73e8; color:#fff; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; margin:4px auto; font-size:12px; font-weight:500;">${d}</div>`
      : `<div style="text-align:center; margin:4px 0; font-size:12px; font-weight:500; color:#3c4043; height:24px; display:flex; align-items:center; justify-content:center;">${d}</div>`;

    calHTML += `<div class="cal-day${isToday ? ' today' : ''}" onclick="openDayModal('${dateStr}')" style="background:#fff; min-height:120px; padding:2px; cursor:pointer; transition:background 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='#fff'">
      ${dayNumHTML}
      <div style="display:flex;flex-direction:column;gap:2px;padding:0 2px;">
      ${daySessionsArr.slice(0, 3).map(s => {
        const teacher = DB.getTeacher(s.teacherId);
        const tName = teacher ? teacher.name.split(' ')[0] : 'TBA';
        const isRecurring = !!s.schedule_id;

        let bgStyle = '#8e24aa';
        if (s.courseType && s.courseType.toLowerCase() === 'quran') { bgStyle = '#0b8043'; }
        if (s.courseType && s.courseType.toLowerCase() === 'arabic') { bgStyle = '#039be5'; }
        if (s.courseType && s.courseType.toLowerCase() === 'fiqh') { bgStyle = '#f09300'; }

        return `<div class="cal-event" style="background:${bgStyle};color:#fff;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;display:flex;align-items:center;gap:3px;" onclick="event.stopPropagation(); viewSessionModal('${s.id}')" title="${UI.fmt.time(s.time)} - ${tName}">
          ${isRecurring ? '<span title="Recurring">🔄</span>' : ''}${s.time.substring(0,5)} ${tName}
        </div>`;
      }).join('')}
      ${daySessionsArr.length > 3 ? `<div style="font-size:11px;color:#3c4043;font-weight:500;padding-left:4px;margin-top:2px;cursor:pointer;" onclick="event.stopPropagation(); openDayModal('${dateStr}')">+${daySessionsArr.length-3} more</div>` : ''}
      </div>
    </div>`;
  }

  calHTML += `</div></div></div></div>`;
  container.innerHTML = calHTML;
}

/* ── List View ── */
function renderListView(container) {
  const allSessions = DB.getSessions();
  const upcoming = allSessions.filter(s => s.status === 'upcoming' || s.status === 'scheduled');
  const past     = allSessions.filter(s => s.status === 'completed');

  container.innerHTML = `
    <div class="tab-bar">
      <button class="tab-btn active" id="tab-upcoming" onclick="switchSessionTab('upcoming')">${window.t?window.t('Upcoming'):'Upcoming'} (${upcoming.length})</button>
      <button class="tab-btn" id="tab-past" onclick="switchSessionTab('past')">${window.t?window.t('Past Sessions'):'Past Sessions'}</button>
    </div>
    <div id="session-tab-content"></div>
  `;

  renderSessionTab('upcoming', upcoming);
}

window.switchSessionTab = async function(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${tab}`)?.classList.add('active');
  await DB.loadState();
  const sessions = DB.getSessions({ status: tab === 'upcoming' ? ['upcoming','scheduled'] : 'completed' });
  renderSessionTab(tab, sessions);
};

function renderSessionTab(tab, sessions) {
  const content = document.getElementById('session-tab-content');
  if (!content) return;
  if (!sessions.length) {
    content.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📅</div><p class="empty-state-title">${window.t?window.t('No sessions'):'No sessions'}</p></div>`;
    return;
  }

  const byDate = {};
  sessions.forEach(s => {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  });

  const dates = Object.keys(byDate).sort((a,b) => tab === 'upcoming' ? a.localeCompare(b) : b.localeCompare(a));

  let html = `<div class="session-list">`;
  dates.forEach(d => {
    html += `
      <div style="margin-top:var(--space-5); margin-bottom:var(--space-3); font-weight:800; font-size:16px; color:var(--text-primary); border-bottom:1px solid var(--border); padding-bottom:6px;">
        ${UI.fmt.date(d)}
      </div>
    `;

    byDate[d].sort((a,b) => a.time.localeCompare(b.time));

    byDate[d].forEach(s => {
      const teacher = DB.getTeacher(s.teacherId);
      const [ss, ts] = UI.fmt.sessionStatus(s.status);
      const isRecurring = !!s.schedule_id;
      html += `
        <div class="session-card" style="cursor:pointer; margin-bottom:8px;" onclick="viewSessionModal('${s.id}')">
          <div class="session-time-block"><div class="session-time">${UI.fmt.time(s.time)}</div><div class="session-duration">${s.duration}m</div></div>
          <div class="session-divider"></div>
          <div class="session-info">
            <div class="session-title">
              ${isRecurring ? '<span title="Recurring schedule" style="margin-right:4px;">🔄</span>' : ''}
              ${s.courseType} <span style="font-weight:normal;color:var(--text-muted);font-size:12px;">with</span> ${teacher ? teacher.name : '—'}
            </div>
            <div class="session-meta">${s.studentIds.length} student(s)</div>
          </div>
          <span class="badge badge-${UI.fmt.courseColor(s.courseType)}">${window.t?window.t(s.courseType):s.courseType}</span>
          ${tab === 'upcoming' ? `
          <div class="session-actions" style="margin-left:var(--space-4)">
            <button class="btn btn-ghost btn-sm btn-icon" title="${window.t?window.t('Mark Done'):'Mark Done'}" style="color:var(--success)" onclick="event.stopPropagation(); completeSession('${s.id}')">✔</button>
            <button class="btn btn-ghost btn-sm btn-icon" title="${window.t?window.t('Cancel'):'Cancel'}" style="color:var(--danger)" onclick="event.stopPropagation(); cancelSession('${s.id}')">✕</button>
          </div>` : ''}
        </div>
      `;
    });
  });
  html += `</div>`;
  content.innerHTML = html;
}

window.openDayModal = function(dateStr) {
  const sessions = DB.getSessions({ date: dateStr });
  const label = UI.fmt.date(dateStr);
  UI.openModal(`Sessions — ${label}`, `
    <div style="margin-bottom:var(--space-4)">
      <button class="btn btn-primary btn-sm" onclick="UI.closeModal();openSetScheduleModal()">+ Set Student Schedule</button>
    </div>
    ${sessions.length === 0 ? '<div class="empty-state" style="padding:var(--space-8)"><div class="empty-state-icon">🌙</div><p class="empty-state-title">No sessions this day</p></div>' :
    `<div class="session-list">
      ${sessions.map(s => {
        const teacher = DB.getTeacher(s.teacherId);
        const isRecurring = !!s.schedule_id;
        return `<div class="session-card" style="cursor:pointer" onclick="UI.closeModal(); setTimeout(() => viewSessionModal('${s.id}'), 100)">
          <div class="session-time-block"><div class="session-time">${UI.fmt.time(s.time)}</div><div class="session-duration">${s.duration}m</div></div>
          <div class="session-divider"></div>
          <div class="session-info">
            <div class="session-title">${isRecurring ? '🔄 ' : ''}${s.courseType}</div>
            <div class="session-meta">👨‍🏫 ${teacher ? teacher.name : '—'} · ${s.studentIds.length} student(s)</div>
          </div>
          <span class="badge badge-${UI.fmt.courseColor(s.courseType)}">${window.t?window.t(s.courseType):s.courseType}</span>
        </div>`;
      }).join('')}
    </div>`}
  `);
};

/* ── View Session Modal ── */
window.viewSessionModal = function(id) {
  const s = DB.getSession(id);
  if (!s) return;
  const teacher = DB.getTeacher(s.teacherId);
  const students = (s.studentIds || []).map(sid => DB.getStudent(sid)).filter(Boolean);
  const isRecurring = !!s.schedule_id;
  const today = new Date().toISOString().split('T')[0];
  const isFuture = s.date > today;

  UI.openModal('Session Details', `
    <div style="margin-bottom:var(--space-4);text-align:center;">
      <span class="badge badge-${UI.fmt.courseColor(s.courseType)}" style="font-size:16px;padding:6px 16px;">${window.t?window.t(s.courseType):s.courseType} Session</span>
      ${isRecurring ? `<span style="margin-left:8px;font-size:13px;color:var(--text-muted)">🔄 Part of recurring schedule</span>` : ''}
    </div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Date'):'Date'}</span><span class="info-row-value" style="font-weight:700;font-size:15px;">${UI.fmt.date(s.date)}</span></div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Time'):'Time'}</span><span class="info-row-value" style="color:var(--gold-300);font-weight:700;font-size:15px;">${UI.fmt.time(s.time)} (${s.duration} min)</span></div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Teacher'):'Teacher'}</span><span class="info-row-value" style="font-weight:600;">${teacher ? teacher.name : '—'}</span></div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Students'):'Students'}</span><span class="info-row-value">${students.map(st => `<span class="badge badge-gray" style="margin:2px 2px;display:inline-block;">${st.name}</span>`).join(' ')}</span></div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Status'):'Status'}</span><span class="info-row-value">${UI.badge(window.t?window.t(UI.fmt.sessionStatus(s.status)[0]):UI.fmt.sessionStatus(s.status)[0], UI.fmt.sessionStatus(s.status)[1])}</span></div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Zoom Link'):'Zoom Link'}</span><span class="info-row-value"><a href="${s.zoomLink}" target="_blank" class="zoom-badge">🎥 ${window.t?window.t('Join Meeting'):'Join Meeting'}</a></span></div>
    ${s.notes ? `<div class="info-row"><span class="info-row-label">${window.t?window.t('Notes'):'Notes'}</span><span class="info-row-value" style="color:var(--text-secondary)">${s.notes}</span></div>` : ''}
    
    <div style="margin-top:24px;display:flex;gap:12px;justify-content:flex-end;border-top:1px solid var(--border);padding-top:16px;flex-wrap:wrap;">
      ${isRecurring && isFuture ? `<button class="btn btn-secondary" style="color:var(--danger);border-color:var(--danger)" onclick="UI.closeModal(); cancelAllFutureSessions('${s.schedule_id}', '${id}')">Cancel All Future</button>` : ''}
      <button class="btn btn-secondary" style="${s.status === 'cancelled' ? 'border:1px solid var(--danger);background:rgba(231,76,60,0.1)' : ''}" onclick="updateSessionStatusDirect('${s.id}', 'cancelled')">Cancel This</button>
      <button class="btn btn-primary" style="${s.status === 'completed' ? 'border:1px solid #fff' : ''}" onclick="UI.closeModal(); setTimeout(() => updateSessionStatusDirect('${s.id}', 'completed'), 100)">${window.t?window.t('Mark Done'):'Mark Done'}</button>
    </div>
  `);
};

window.cancelAllFutureSessions = async function(scheduleId, currentSessionId) {
  UI.confirm('Cancel ALL future sessions from this recurring schedule? Past sessions will be kept.', async () => {
    UI.toast('Cancelling future sessions...', 'info', 1500);
    await DB.cancelFutureSessionsBySchedule(scheduleId);
    UI.toast('All future sessions cancelled.', 'warning');
    const content = document.getElementById('schedule-view-content');
    if (content) { await DB.loadState(); renderCalendarView(content); }
  });
};

window.updateSessionStatusDirect = async function(id, status) {
  try {
    UI.closeModal();
    UI.toast(window.t ? window.t('Updating session...') : 'Updating session...', 'info', 1000);
    await DB.updateSession(id, { status });
    UI.toast(`Session marked as ${status}.`, 'success');
    const content = document.getElementById('schedule-view-content');
    if (content) {
      if (document.querySelector('.tab-bar')) {
        renderListView(content);
        if (status === 'completed') setTimeout(() => switchSessionTab('past'), 50);
        else setTimeout(() => switchSessionTab('upcoming'), 50);
      } else {
        await DB.loadState();
        renderCalendarView(content);
      }
    }
  } catch (e) { console.error(e); UI.toast('Error updating session status', 'error'); }
};

window.cancelSession = function(id) {
  const s = DB.getSession(id);
  UI.confirm(`Cancel this ${s.courseType} session on ${UI.fmt.date(s.date)}?`, async () => {
    await DB.updateSession(id, { status: 'cancelled' });
    UI.toast('Session cancelled.', 'warning');
    const content = document.getElementById('schedule-view-content');
    if (document.querySelector('.tab-bar')) switchSessionTab('upcoming');
    else if (content) { await DB.loadState(); renderCalendarView(content); }
  });
};

window.completeSession = async function(id) {
  try {
    UI.toast('Updating session...', 'info', 1000);
    await DB.updateSession(id, { status: 'completed' });
    UI.toast('Session marked as completed.', 'success');
    const content = document.getElementById('schedule-view-content');
    if (document.querySelector('.tab-bar')) {
      renderListView(content);
      setTimeout(() => switchSessionTab('past'), 50);
    } else if (content) { await DB.loadState(); renderCalendarView(content); }
  } catch (e) { console.error(e); UI.toast('Error updating session', 'error'); }
};

/* ═══════════════════════════════════════════════════
   SET STUDENT SCHEDULE MODAL — Core New Feature
═══════════════════════════════════════════════════ */

window.openSetScheduleModal = function(preloadStudentId = '') {
  const teachers = DB.getTeachers({ status: 'active' });
  const students = DB.getStudents({ status: 'active' });

  // Default start date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultStart = tomorrow.toISOString().split('T')[0];

  UI.openModal('Set Student Schedule', `
    <style>
      .day-checkbox-grid { display:grid; grid-template-columns: repeat(7, 1fr); gap:6px; margin-top:6px; }
      .day-chip { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:8px 4px; border-radius:8px; border:1.5px solid var(--border); cursor:pointer; transition:all 0.2s; font-size:11px; font-weight:600; user-select:none; background:transparent; color:var(--text-secondary); }
      .day-chip:hover { border-color:var(--primary); color:var(--primary); background:rgba(255,255,255,0.05); }
      .day-chip.selected { border-color:var(--primary); background:var(--primary); color:#fff; }
      .day-chip input { display:none; }
      .schedule-preview-box { margin-top:12px; padding:12px 16px; border-radius:8px; background:rgba(201,168,76,0.08); border:1px solid var(--border-gold); }
      .schedule-preview-box .preview-title { font-weight:700; font-size:12px; color:var(--gold-300); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px; }
      .preview-session-row { display:flex; align-items:center; gap:10px; padding:5px 0; border-bottom:1px solid rgba(201,168,76,0.1); font-size:13px; }
      .preview-session-row:last-child { border-bottom:none; }
      .conflict-warning { margin-top:8px; padding:10px 14px; border-radius:8px; background:rgba(231,76,60,0.1); border:1px solid rgba(231,76,60,0.3); color:#e74c3c; font-size:13px; font-weight:500; }
    </style>

    <!-- Student search -->
    <div class="form-group">
      <label class="form-label">Student <span class="form-required">*</span></label>
      <div style="position:relative;">
        <input type="text" class="form-input-plain" id="sch-student-search" placeholder="Search by name or STU-XXXX..." oninput="schedStudentSearch(this.value)" autocomplete="off" />
        <div id="sch-student-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;z-index:100;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;max-height:180px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.3);"></div>
      </div>
      <input type="hidden" id="sch-student-id" value="${preloadStudentId}" />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Teacher <span class="form-required">*</span></label>
        <select class="form-input-plain" id="sch-teacher" onchange="checkTeacherConflicts()">
          <option value="">Select teacher...</option>
          ${teachers.map(t => `<option value="${t.id}">${t.name} (${(t.specialization||[]).join(', ')})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Course Type <span class="form-required">*</span></label>
        <select class="form-input-plain" id="sch-course">
          <option value="Quran">📖 Quran</option>
          <option value="Arabic">🔤 Arabic</option>
          <option value="Fiqh">📚 Fiqh</option>
        </select>
      </div>
    </div>

    <!-- Days of week -->
    <div class="form-group">
      <label class="form-label">Days of Week <span class="form-required">*</span></label>
      <div class="day-checkbox-grid" id="sch-days-grid">
        ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(day => `
          <div class="day-chip" id="chip-${day}" onclick="toggleDayChip('${day}')">
            <input type="checkbox" id="day-${day}" value="${day}" onchange="updateSchedulePreview()">
            <span>${day.substring(0,3)}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Session Time <span class="form-required">*</span></label>
        <input type="time" class="form-input-plain" id="sch-time" value="09:00" oninput="checkTeacherConflicts()" />
      </div>
      <div class="form-group">
        <label class="form-label">Duration</label>
        <select class="form-input-plain" id="sch-duration">
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60" selected>60 minutes</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Start Date <span class="form-required">*</span></label>
      <input type="date" class="form-input-plain" id="sch-start" value="${defaultStart}" oninput="updateSchedulePreview()" />
    </div>

    <!-- Conflict warning -->
    <div id="sch-conflict-warning" style="display:none;" class="conflict-warning">
      ⚠️ <span id="sch-conflict-text"></span>
    </div>

    <!-- Preview -->
    <div id="sch-preview-box" class="schedule-preview-box" style="display:none;">
      <div class="preview-title">📅 Next Sessions Preview</div>
      <div id="sch-preview-sessions"></div>
    </div>

    <div class="form-actions">
      <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="sch-save-btn" onclick="saveStudentSchedule()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        Save Schedule &amp; Generate Sessions
      </button>
    </div>
  `, true);

  // If preloading a student, fill the name
  if (preloadStudentId) {
    const st = DB.getStudent(preloadStudentId);
    if (st) {
      const inp = document.getElementById('sch-student-search');
      if (inp) inp.value = `${st.name} (${st.id})`;
    }
    // Load existing schedule if any
    setTimeout(() => loadExistingScheduleIntoForm(preloadStudentId), 100);
  }

  window._schedSelectedStudentId = preloadStudentId || '';
};

window.loadExistingScheduleIntoForm = function(studentId) {
  const sched = DB.getStudentSchedule(studentId);
  if (!sched) return;

  // Fill teacher
  const teacherSel = document.getElementById('sch-teacher');
  if (teacherSel) teacherSel.value = sched.teacherId || '';

  // Fill course
  const courseSel = document.getElementById('sch-course');
  if (courseSel) courseSel.value = sched.courseType || 'Quran';

  // Fill days
  (sched.daysOfWeek || []).forEach(day => {
    const chip = document.getElementById(`chip-${day}`);
    const chk = document.getElementById(`day-${day}`);
    if (chip) chip.classList.add('selected');
    if (chk) chk.checked = true;
  });

  // Fill time
  const timeInp = document.getElementById('sch-time');
  if (timeInp && sched.sessionTime) timeInp.value = sched.sessionTime.substring(0,5);

  // Fill duration
  const durSel = document.getElementById('sch-duration');
  if (durSel) durSel.value = String(sched.durationMin || 60);

  updateSchedulePreview();
};

window.schedStudentSearch = function(q) {
  const dropdown = document.getElementById('sch-student-dropdown');
  if (!dropdown) return;
  const query = q.toLowerCase();
  if (!query) { dropdown.style.display = 'none'; return; }

  const all = DB.getStudents({ status: 'active' });
  const filtered = all.filter(s => s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query));

  if (!filtered.length) {
    dropdown.innerHTML = `<div style="padding:12px;color:var(--text-muted);font-size:13px;">No students found</div>`;
  } else {
    dropdown.innerHTML = filtered.map(s => `
      <div style="padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border-light);" 
           onmouseenter="this.style.background='rgba(255,255,255,0.05)'" 
           onmouseleave="this.style.background='transparent'"
           onclick="selectScheduleStudent('${s.id}', '${s.name}')">
        <strong>${s.name}</strong> <code style="color:var(--gold-300);font-size:11px;">${s.id}</code>
      </div>
    `).join('');
  }
  dropdown.style.display = 'block';
};

window.selectScheduleStudent = function(id, name) {
  window._schedSelectedStudentId = id;
  const inp = document.getElementById('sch-student-search');
  const hiddenInp = document.getElementById('sch-student-id');
  const dropdown = document.getElementById('sch-student-dropdown');
  if (inp) inp.value = `${name} (${id})`;
  if (hiddenInp) hiddenInp.value = id;
  if (dropdown) dropdown.style.display = 'none';
  // Load existing schedule if any
  loadExistingScheduleIntoForm(id);
  checkTeacherConflicts();
};

window.toggleDayChip = function(day) {
  const chip = document.getElementById(`chip-${day}`);
  const chk  = document.getElementById(`day-${day}`);
  if (!chip || !chk) return;
  chk.checked = !chk.checked;
  chip.classList.toggle('selected', chk.checked);
  updateSchedulePreview();
  checkTeacherConflicts();
};

function getSelectedDays() {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return days.filter(day => {
    const chk = document.getElementById(`day-${day}`);
    return chk && chk.checked;
  });
}

window.updateSchedulePreview = function() {
  const previewBox   = document.getElementById('sch-preview-box');
  const previewSess  = document.getElementById('sch-preview-sessions');
  const startDateVal = document.getElementById('sch-start')?.value;

  const selectedDays = getSelectedDays();

  if (!previewBox || !previewSess || selectedDays.length === 0 || !startDateVal) {
    if (previewBox) previewBox.style.display = 'none';
    return;
  }

  const sessions = DB.previewScheduleSessions(selectedDays, startDateVal, 4);
  if (!sessions.length) { previewBox.style.display = 'none'; return; }

  previewBox.style.display = 'block';
  previewSess.innerHTML = sessions.map(({ date, dayName }) => `
    <div class="preview-session-row">
      <span style="font-size:16px;">📅</span>
      <span style="font-weight:600;">${dayName}</span>
      <span style="color:var(--text-secondary);">${UI.fmt.date(date)}</span>
    </div>
  `).join('');
};

window.checkTeacherConflicts = function() {
  const teacherId = document.getElementById('sch-teacher')?.value;
  const timeVal   = document.getElementById('sch-time')?.value;
  const warnBox   = document.getElementById('sch-conflict-warning');
  const warnTxt   = document.getElementById('sch-conflict-text');
  if (!warnBox || !warnTxt) return;

  if (!teacherId || !timeVal) { warnBox.style.display = 'none'; return; }

  const selectedDays = getSelectedDays();
  if (!selectedDays.length) { warnBox.style.display = 'none'; return; }

  const today = new Date().toISOString().split('T')[0];
  const teacherSessions = DB.getSessions({ teacherId }).filter(s =>
    (s.status === 'scheduled' || s.status === 'upcoming') && s.date >= today && s.time && s.time.substring(0,5) === timeVal.substring(0,5)
  );

  const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const conflicts = teacherSessions.filter(s => {
    const d = new Date(s.date + 'T00:00:00');
    return selectedDays.includes(DAY_NAMES[d.getDay()]);
  });

  if (conflicts.length > 0) {
    const teacher = DB.getTeacher(teacherId);
    warnTxt.textContent = `${teacher ? teacher.name : 'This teacher'} already has ${conflicts.length} session(s) at ${timeVal} on the selected day(s). Check the schedule before saving.`;
    warnBox.style.display = 'block';
  } else {
    warnBox.style.display = 'none';
  }
};

window.saveStudentSchedule = async function() {
  const studentId  = window._schedSelectedStudentId || document.getElementById('sch-student-id')?.value;
  const teacherId  = document.getElementById('sch-teacher')?.value;
  const courseType = document.getElementById('sch-course')?.value;
  const sessionTime= document.getElementById('sch-time')?.value;
  const durationMin= parseInt(document.getElementById('sch-duration')?.value || '60');
  const startDate  = document.getElementById('sch-start')?.value;
  const daysOfWeek = getSelectedDays();

  if (!studentId) { UI.toast('Please select a student.', 'error'); return; }
  if (!teacherId) { UI.toast('Please select a teacher.', 'error'); return; }
  if (!daysOfWeek.length) { UI.toast('Please select at least one day of the week.', 'error'); return; }
  if (!sessionTime) { UI.toast('Please select a session time.', 'error'); return; }
  if (!startDate)   { UI.toast('Please select a start date.', 'error'); return; }

  const saveBtn = document.getElementById('sch-save-btn');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Generating sessions...'; }

  try {
    await DB.saveStudentSchedule({ studentId, teacherId, courseType, daysOfWeek, sessionTime, durationMin, startDate });
    UI.closeModal();

    const student = DB.getStudent(studentId);
    const teacher = DB.getTeacher(teacherId);
    UI.toast(`Schedule saved! Sessions generated for ${student ? student.name : studentId}.`, 'success');
    DB.addNotification({
      title: 'Schedule Created',
      body: `${courseType} schedule set for ${student ? student.name : studentId} with ${teacher ? teacher.name : teacherId} on ${daysOfWeek.join(', ')}.`,
      type: 'schedule'
    });
    UI.renderNotifications?.();

    const content = document.getElementById('schedule-view-content');
    if (content) {
      await DB.loadState();
      if (document.querySelector('.tab-bar')) renderListView(content);
      else renderCalendarView(content);
    }
  } catch(e) {
    console.error(e);
    UI.toast('Error saving schedule: ' + (e.message || 'Unknown error'), 'error');
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Schedule & Generate Sessions'; }
  }
};

/* ── Legacy wrappers so old code paths still work ── */
window.openNewSessionModal = window.openSetScheduleModal;
window.openEditSessionModal = function(id) {
  const s = DB.getSession(id);
  if (s && s.schedule_id) {
    // For recurring sessions, open the schedule editor
    const students = (s.studentIds || []);
    const studentId = students[0];
    if (studentId) {
      openSetScheduleModal(studentId);
      return;
    }
  }
  // Fallback: basic status edit
  UI.openModal('Edit Session', `
    <div class="form-group">
      <label class="form-label">Status</label>
      <select class="form-input-plain" id="ess-status">
        <option value="upcoming" ${s && s.status==='upcoming'?'selected':''}>Upcoming</option>
        <option value="scheduled" ${s && s.status==='scheduled'?'selected':''}>Scheduled</option>
        <option value="completed" ${s && s.status==='completed'?'selected':''}>Completed</option>
        <option value="cancelled" ${s && s.status==='cancelled'?'selected':''}>Cancelled</option>
      </select>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditSession('${id}')">Save</button>
    </div>
  `, true);
};

window.saveEditSession = async function(id) {
  const status = document.getElementById('ess-status')?.value;
  await DB.updateSession(id, { status });
  UI.closeModal();
  UI.toast('Session updated.', 'success');
  const content = document.getElementById('schedule-view-content');
  if (content) { await DB.loadState(); renderCalendarView(content); }
};
