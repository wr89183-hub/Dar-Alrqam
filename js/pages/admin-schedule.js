/* ================================================
   ADMIN SCHEDULE PAGE — Full Calendar + Session Management
   ================================================ */
let calendarState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
};

Router.register('admin-schedule', async function(container) {
  // Show loading state first, then load real-time
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
        <button class="btn btn-primary" onclick="openNewSessionModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          ${window.t?window.t('New Session'):'New Session'}
        </button>
      </div>
    </div>

    <!-- Course legend -->
    <div style="display:flex;gap:var(--space-4);margin-bottom:var(--space-5);flex-wrap:wrap">
      <div class="legend-item"><div class="legend-dot" style="background:#2ECC71"></div><span class="legend-text">Quran</span></div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--gold-300)"></div><span class="legend-text">Arabic</span></div>
      <div class="legend-item"><div class="legend-dot" style="background:#BB8FCE"></div><span class="legend-text">Fiqh</span></div>
    </div>

    <div id="schedule-view-content"></div>
  `;

  // Start with calendar view by default
  switchScheduleView('calendar');
}

window.switchScheduleView = async function(view) {
  const content = document.getElementById('schedule-view-content');
  const listBtn = document.getElementById('view-list-btn');
  const calBtn  = document.getElementById('view-cal-btn');
  if (!content) return;

  await DB.loadState(); // Ensure real-time load before rendering

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
  if (content) {
    await DB.loadState();
    renderCalendarView(content);
  }
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

  // Group sessions by date
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

  // Empty cells before month start
  for (let i = 0; i < firstDay; i++) {
    calHTML += `<div class="cal-day other-month" style="background:#fff; min-height:120px;"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const daySessionsArr = byDate[dateStr] || [];
    
    // Sort sessions by time within the day
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
        
        // Define colors based on course Type (Google Calendar solid style)
        let bgStyle = '#8e24aa'; // default purple
        if (s.courseType.toLowerCase() === 'quran') { bgStyle = '#0b8043'; } // Green
        if (s.courseType.toLowerCase() === 'arabic') { bgStyle = '#039be5'; } // Blue
        if (s.courseType.toLowerCase() === 'fiqh') { bgStyle = '#f09300'; } // Orange

        return `<div class="cal-event" style="background:${bgStyle};color:#fff;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;" onclick="event.stopPropagation(); viewSessionModal('${s.id}')" title="${UI.fmt.time(s.time)} - ${tName}">
          ${s.time.substring(0,5)} ${tName}
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
  const upcoming = allSessions.filter(s => s.status === 'upcoming');
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
  const sessions = DB.getSessions({ status: tab === 'upcoming' ? 'upcoming' : 'completed' });
  renderSessionTab(tab, sessions);
};

function renderSessionTab(tab, sessions) {
  const content = document.getElementById('session-tab-content');
  if (!content) return;
  if (!sessions.length) {
    content.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📅</div><p class="empty-state-title">${window.t?window.t('No sessions'):'No sessions'}</p></div>`;
    return;
  }
  
  // Group by date
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
    
    // Sort chronologically within the day
    byDate[d].sort((a,b) => a.time.localeCompare(b.time));

    byDate[d].forEach(s => {
      const teacher = DB.getTeacher(s.teacherId);
      const [ss, ts] = UI.fmt.sessionStatus(s.status);
      html += `
        <div class="session-card" style="cursor:pointer; margin-bottom:8px;" onclick="viewSessionModal('${s.id}')">
          <div class="session-time-block"><div class="session-time">${UI.fmt.time(s.time)}</div><div class="session-duration">${s.duration}m</div></div>
          <div class="session-divider"></div>
          <div class="session-info">
            <div class="session-title">${s.courseType} <span style="font-weight:normal;color:var(--text-muted);font-size:12px;">with</span> ${teacher ? teacher.name : '—'}</div>
            <div class="session-meta">${s.studentIds.length} student(s) · ${window.t?window.t(UI.fmt.recurrence(s.recurrence)):UI.fmt.recurrence(s.recurrence)}</div>
          </div>
          <span class="badge badge-${UI.fmt.courseColor(s.courseType)}">${window.t?window.t(s.courseType):s.courseType}</span>
          ${tab === 'upcoming' ? `
          <div class="session-actions" style="margin-left:var(--space-4)">
            <button class="btn btn-ghost btn-sm btn-icon" title="${window.t?window.t('Mark Done'):'Mark Done'}" style="color:var(--success)" onclick="event.stopPropagation(); completeSession('${s.id}')">✔</button>
            <button class="btn btn-ghost btn-sm btn-icon" title="${window.t?window.t('Edit'):'Edit'}" onclick="event.stopPropagation(); openEditSessionModal('${s.id}')">✎</button>
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
      <button class="btn btn-primary btn-sm" onclick="UI.closeModal();openNewSessionModal('${dateStr}')">+ New Session This Day</button>
    </div>
    ${sessions.length === 0 ? '<div class="empty-state" style="padding:var(--space-8)"><div class="empty-state-icon">🌙</div><p class="empty-state-title">No sessions this day</p></div>' :
    `<div class="session-list">
      ${sessions.map(s => {
        const teacher = DB.getTeacher(s.teacherId);
        return `<div class="session-card" style="cursor:pointer" onclick="UI.closeModal(); setTimeout(() => viewSessionModal('${s.id}'), 100)">
          <div class="session-time-block"><div class="session-time">${UI.fmt.time(s.time)}</div><div class="session-duration">${s.duration}m</div></div>
          <div class="session-divider"></div>
          <div class="session-info">
            <div class="session-title">${s.courseType}</div>
            <div class="session-meta">👨‍🏫 ${teacher ? teacher.name : '—'} · ${s.studentIds.length} student(s)</div>
          </div>
          <span class="badge badge-${UI.fmt.courseColor(s.courseType)}">${window.t?window.t(s.courseType):s.courseType}</span>
        </div>`;
      }).join('')}
    </div>`}
  `);
};

window.viewSessionModal = function(id) {
  const s = DB.getSession(id);
  const teacher = DB.getTeacher(s.teacherId);
  const students = s.studentIds.map(sid => DB.getStudent(sid)).filter(Boolean);
  UI.openModal('Session Details', `
    <div style="margin-bottom:var(--space-4);text-align:center;">
      <span class="badge badge-${UI.fmt.courseColor(s.courseType)}" style="font-size:16px;padding:6px 16px;">${window.t?window.t(s.courseType):s.courseType} Session</span>
    </div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Date'):'Date'}</span><span class="info-row-value" style="font-weight:700;font-size:15px;">${UI.fmt.date(s.date)}</span></div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Time'):'Time'}</span><span class="info-row-value" style="color:var(--gold-300);font-weight:700;font-size:15px;">${UI.fmt.time(s.time)} (${s.duration} min)</span></div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Teacher'):'Teacher'}</span><span class="info-row-value" style="font-weight:600;">${teacher ? teacher.name : '—'}</span></div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Students'):'Students'}</span><span class="info-row-value">${students.map(st => `<span class="badge badge-gray" style="margin:2px 2px;display:inline-block;">${st.name}</span>`).join(' ')}</span></div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Status'):'Status'}</span><span class="info-row-value">${UI.badge(window.t?window.t(UI.fmt.sessionStatus(s.status)[0]):UI.fmt.sessionStatus(s.status)[0], UI.fmt.sessionStatus(s.status)[1])}</span></div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Zoom Link'):'Zoom Link'}</span><span class="info-row-value"><a href="${s.zoomLink}" target="_blank" class="zoom-badge">🎥 ${window.t?window.t('Join Meeting'):'Join Meeting'}</a></span></div>
    ${s.notes ? `<div class="info-row"><span class="info-row-label">${window.t?window.t('Notes'):'Notes'}</span><span class="info-row-value" style="color:var(--text-secondary)">${s.notes}</span></div>` : ''}
    
    <div style="margin-top:24px;display:flex;gap:12px;justify-content:flex-end;border-top:1px solid var(--border);padding-top:16px">
      <button class="btn btn-secondary" style="${s.status === 'cancelled' ? 'border:1px solid var(--danger);background:rgba(231,76,60,0.1)' : ''}" onclick="updateSessionStatusDirect('${s.id}', 'cancelled')">${window.t?window.t('Cancel'):'Cancel'}</button>
      <button class="btn btn-secondary" onclick="UI.closeModal(); setTimeout(() => openEditSessionModal('${s.id}'), 100)">${window.t?window.t('Edit'):'Edit'}</button>
      <button class="btn btn-primary" style="${s.status === 'completed' ? 'border:1px solid #fff' : ''}" onclick="UI.closeModal(); setTimeout(() => updateSessionStatusDirect('${s.id}', 'completed'), 100)">${window.t?window.t('Mark Done'):'Mark Done'}</button>
    </div>
  `);
};

window.updateSessionStatusDirect = async function(id, status) {
  try {
    UI.closeModal();
    UI.toast(window.t ? window.t('Updating session...') : 'Updating session...', 'info', 1000);
    await DB.updateSession(id, { status });
    UI.toast(window.t ? window.t(`Session marked as ${status}.`) : `Session marked as ${status}.`, 'success');
    
    // Completely re-render the appropriate view
    const content = document.getElementById('schedule-view-content');
    if (content) {
      if (document.querySelector('.tab-bar')) {
        renderListView(content);
        if (status === 'completed') {
           setTimeout(() => switchSessionTab('past'), 50);
        } else {
           setTimeout(() => switchSessionTab('upcoming'), 50);
        }
      } else {
        await DB.loadState();
        renderCalendarView(content);
      }
    }
  } catch (e) {
    console.error(e);
    UI.toast('Error updating session status', 'error');
  }
};

window.cancelSession = function(id) {
  const s = DB.getSession(id);
  UI.confirm(`Cancel this ${s.courseType} session on ${UI.fmt.date(s.date)}?`, async () => {
    await DB.updateSession(id, { status: 'cancelled' });
    UI.toast('Session cancelled.', 'warning');
    const content = document.getElementById('schedule-view-content');
    if (document.querySelector('.tab-bar')) {
      switchSessionTab('upcoming');
    } else if (content) {
      await DB.loadState();
      renderCalendarView(content);
    }
  });
};

window.completeSession = async function(id) {
  try {
    UI.toast(window.t ? window.t('Updating session...') : 'Updating session...', 'info', 1000);
    await DB.updateSession(id, { status: 'completed' });
    UI.toast(window.t ? window.t('Session marked as completed.') : 'Session marked as completed.', 'success');
    
    const content = document.getElementById('schedule-view-content');
    if (document.querySelector('.tab-bar')) {
      renderListView(content);
      setTimeout(() => switchSessionTab('past'), 50);
    } else if (content) {
      await DB.loadState();
      renderCalendarView(content);
    }
  } catch (e) {
    console.error(e);
    UI.toast('Error updating session', 'error');
  }
};

/* ── New Session Modal ── */
window.openNewSessionModal = function(preDate = '') {
  const teachers = DB.getTeachers({ status: 'active' });
  const students = DB.getStudents({ status: 'active' });
  UI.openModal('Create New Session', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Course Type <span class="form-required">*</span></label>
        <select class="form-input-plain" id="ns-course">
          <option value="Quran">📖 Quran</option>
          <option value="Arabic">🔤 Arabic</option>
          <option value="Fiqh">📚 Islamic Fiqh</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Teacher <span class="form-required">*</span></label>
        <select class="form-input-plain" id="ns-teacher">
          <option value="">Select teacher...</option>
          ${teachers.map(t => `<option value="${t.id}">${t.name} (${t.specialization.join(', ')})</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Date <span class="form-required">*</span></label>
        <input type="date" class="form-input-plain" id="ns-date" value="${preDate || new Date().toISOString().split('T')[0]}" />
      </div>
      <div class="form-group">
        <label class="form-label">Start Time <span class="form-required">*</span></label>
        <input type="time" class="form-input-plain" id="ns-time" value="09:00" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Duration</label>
        <select class="form-input-plain" id="ns-duration">
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60" selected>60 minutes</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Recurrence</label>
        <select class="form-input-plain" id="ns-recur">
          <option value="once">One-time</option>
          <option value="weekly" selected>Weekly</option>
          <option value="biweekly">Bi-weekly</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Students <span class="form-required">*</span></label>
      <div id="ns-selected-tags" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;min-height:28px;"></div>
      <input type="text" class="form-input-plain" id="ns-student-search" placeholder="Search by name or code (STU-XXXX)..." oninput="filterSessionStudents(this.value)">
      <div id="ns-student-list" style="margin-top:8px;max-height:180px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius-sm);background:rgba(0,0,0,0.2);padding:4px;">
        <!-- realtime populated -->
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewSession()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        Create Session
      </button>
    </div>
  `, true);
  
  window._modalSelectedStudents = new Set();
  setTimeout(() => filterSessionStudents(''), 50);
};

window.filterSessionStudents = function(q) {
  const query = q.toLowerCase();
  const allStudents = DB.getStudents({ status: 'active' });
  const filtered = allStudents.filter(s => s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query));
  const listEl = document.getElementById('ns-student-list');
  if (!listEl) return;
  if (!filtered.length) {
    listEl.innerHTML = '<div style="padding:10px;color:var(--text-muted);text-align:center;font-size:12px;">No students found</div>';
    return;
  }
  listEl.innerHTML = filtered.map(s => {
    const family = DB.getFamily(s.familyId);
    const isChecked = window._modalSelectedStudents.has(s.id);
    return `
      <label class="student-picker-row" style="display:flex;align-items:center;padding:8px;gap:10px;cursor:pointer;border-bottom:1px solid var(--border-light);border-radius:4px;transition:background 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.05)'" onmouseleave="this.style.background='transparent'">
        <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleSessionStudent('${s.id}')" style="width:16px;height:16px;">
        <div style="flex:1;">
          <div style="font-weight:600;font-size:13px;">${s.name} <code style="color:var(--gold-300);font-size:11px;margin-left:4px;">${s.id}</code></div>
          <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">
            ${s.courses.length ? s.courses.map(c=>window.t?window.t(c):c).join(', ') : 'No course'} • ${family ? family.name : 'Unknown Family'}
          </div>
        </div>
      </label>
    `;
  }).join('');
};

window.toggleSessionStudent = function(id) {
  if (window._modalSelectedStudents.has(id)) {
    window._modalSelectedStudents.delete(id);
  } else {
    window._modalSelectedStudents.add(id);
  }
  renderSessionStudentTags();
};

window.renderSessionStudentTags = function() {
  const container = document.getElementById('ns-selected-tags');
  if (!container) return;
  
  let html = '';
  window._modalSelectedStudents.forEach(id => {
    const s = DB.getStudent(id);
    if (!s) return;
    html += `<div style="display:inline-flex;align-items:center;background:rgba(201,168,76,0.15);color:var(--gold-300);padding:4px 8px;border-radius:12px;font-size:12px;border:1px solid var(--border-gold);">
      ${s.name}
      <span style="margin-left:6px;cursor:pointer;font-weight:bold;font-size:14px;line-height:1;" onclick="toggleSessionStudent('${id}'); filterSessionStudents(document.getElementById('ns-student-search').value);">&times;</span>
    </div>`;
  });
  container.innerHTML = html;
};

window.saveNewSession = async function() {
  const courseType  = document.getElementById('ns-course').value;
  const teacherId   = document.getElementById('ns-teacher').value;
  const date        = document.getElementById('ns-date').value;
  const time        = document.getElementById('ns-time').value;
  const duration    = parseInt(document.getElementById('ns-duration').value);
  const recurrence  = document.getElementById('ns-recur').value;
  const selStudents = Array.from(window._modalSelectedStudents);

  if (!teacherId || !date || !time || !selStudents.length) {
    UI.toast('Please fill in all required fields and select at least one student.', 'error');
    return;
  }

  const session = await DB.addSession({ courseType, teacherId, date, time, duration, recurrence, studentIds: selStudents, color: UI.fmt.courseColor(courseType) });
  UI.closeModal();
  UI.toast(`Session created! Zoom link generated automatically.`, 'success');
  DB.addNotification({ title: 'New Session Created', body: `${courseType} session on ${UI.fmt.date(date)} has been created.`, type: 'session' });
  UI.renderNotifications();
  
  const content = document.getElementById('schedule-view-content');
  if (document.querySelector('.tab-bar')) {
    switchSessionTab('upcoming');
  } else if (content) {
    await DB.loadState();
    renderCalendarView(content);
  }
};

window.openEditSessionModal = function(id) {
  const s = DB.getSession(id);
  const teachers = DB.getTeachers({ status: 'active' });
  UI.openModal(window.t?window.t('Edit Session'):'Edit Session', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">${window.t?window.t('Course Type'):'Course Type'}</label>
        <select class="form-input-plain" id="ess-course">
          <option value="Quran" ${s.courseType==='Quran'?'selected':''}>📖 ${window.t?window.t('Quran'):'Quran'}</option>
          <option value="Arabic" ${s.courseType==='Arabic'?'selected':''}>🔤 ${window.t?window.t('Arabic'):'Arabic'}</option>
          <option value="Fiqh" ${s.courseType==='Fiqh'?'selected':''}>📚 ${window.t?window.t('Fiqh'):'Fiqh'}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">${window.t?window.t('Teacher'):'Teacher'}</label>
        <select class="form-input-plain" id="ess-teacher">
          ${teachers.map(t => `<option value="${t.id}" ${s.teacherId===t.id?'selected':''}>${t.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">${window.t?window.t('Date'):'Date'}</label>
        <input type="date" class="form-input-plain" id="ess-date" value="${s.date}" />
      </div>
      <div class="form-group">
        <label class="form-label">${window.t?window.t('Start Time'):'Start Time'}</label>
        <input type="time" class="form-input-plain" id="ess-time" value="${s.time}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">${window.t?window.t('Duration'):'Duration'}</label>
      <select class="form-input-plain" id="ess-duration">
        <option value="30" ${s.duration===30?'selected':''}>30 ${window.t?window.t('minutes'):'minutes'}</option>
        <option value="45" ${s.duration===45?'selected':''}>45 ${window.t?window.t('minutes'):'minutes'}</option>
        <option value="60" ${s.duration===60?'selected':''}>60 ${window.t?window.t('minutes'):'minutes'}</option>
      </select>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="UI.closeModal()">${window.t?window.t('Cancel'):'Cancel'}</button>
      <button class="btn btn-primary" onclick="saveEditSession('${id}')">${window.t?window.t('Save Changes'):'Save Changes'}</button>
    </div>
  `, true);
};

window.saveEditSession = async function(id) {
  const courseType = document.getElementById('ess-course').value;
  const teacherId  = document.getElementById('ess-teacher').value;
  const date       = document.getElementById('ess-date').value;
  const time       = document.getElementById('ess-time').value;
  const duration   = parseInt(document.getElementById('ess-duration').value);

  await DB.updateSession(id, { courseType, teacherId, date, time, duration, color: UI.fmt.courseColor(courseType) });
  UI.closeModal();
  UI.toast(window.t?window.t('Session updated successfully!'):'Session updated successfully!', 'success');
  
  const content = document.getElementById('schedule-view-content');
  if (document.querySelector('.tab-bar')) {
    switchSessionTab('upcoming');
  } else if (content) {
    await DB.loadState();
    renderCalendarView(content);
  }
};
