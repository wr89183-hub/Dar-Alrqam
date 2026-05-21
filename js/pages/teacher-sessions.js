/* ================================================
   TEACHER SESSIONS & ATTENDANCE PAGES
   ================================================ */

Router.register('teacher-sessions', function(container) {
  const teacherId = Auth.getRefId();
  const allSessions = DB.getSessions({ teacherId });
  const upcoming  = allSessions.filter(s => s.status === 'upcoming');
  const completed = allSessions.filter(s => s.status === 'completed');

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">My Sessions</h2>
        <p class="section-subtitle">${allSessions.length} total sessions — ${upcoming.length} upcoming</p>
      </div>
    </div>

    <div class="tab-bar">
      <button class="tab-btn active" id="tsess-upcoming" onclick="switchTeacherSessionTab('upcoming')">Upcoming (${upcoming.length})</button>
      <button class="tab-btn" id="tsess-past" onclick="switchTeacherSessionTab('past')">Past Sessions (${completed.length})</button>
    </div>
    <div id="teacher-sess-content"></div>
  `;

  renderTeacherSessionList('upcoming', upcoming);
});

window.switchTeacherSessionTab = function(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tsess-${tab}`)?.classList.add('active');
  const tid = Auth.getRefId();
  const sessions = DB.getSessions({ teacherId: tid, status: tab === 'upcoming' ? 'upcoming' : 'completed' });
  renderTeacherSessionList(tab, sessions);
};

function renderTeacherSessionList(tab, sessions) {
  const content = document.getElementById('teacher-sess-content');
  if (!content) return;
  if (!sessions.length) {
    content.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📅</div><p class="empty-state-title">No ${tab} sessions</p></div>`;
    return;
  }
  content.innerHTML = `<div class="session-list">
    ${sessions.map(s => {
      const students = s.studentIds.map(id => DB.getStudent(id)).filter(Boolean);
      const att = DB.getAttendance({ sessionId: s.id });
      const hasAtt = att.length > 0;
      const accessible = UI.fmt.isZoomAccessible(s.date, s.time);
      return `<div class="content-card" style="margin-bottom:var(--space-3)">
        <div class="card-body">
          <div style="display:flex;align-items:flex-start;gap:var(--space-4);flex-wrap:wrap">
            <div style="min-width:80px;text-align:center;padding:var(--space-3);border-radius:var(--radius-md);border:1px solid var(--border);background:rgba(255,255,255,0.02)">
              <div style="font-size:var(--text-xs);color:var(--text-muted)">${new Date(s.date+'T12:00').toLocaleDateString('en-GB',{weekday:'short'})}</div>
              <div style="font-size:var(--text-2xl);font-weight:800;color:var(--gold-300);line-height:1">${new Date(s.date+'T12:00').getDate()}</div>
              <div style="font-size:var(--text-xs);color:var(--text-muted)">${new Date(s.date+'T12:00').toLocaleDateString('en-GB',{month:'short'})}</div>
            </div>
            <div style="flex:1;min-width:200px">
              <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-1)">
                <span class="badge badge-${UI.fmt.courseColor(s.courseType)}">${s.courseType}</span>
                <span style="color:var(--gold-300);font-weight:700">${UI.fmt.time(s.time)}</span>
                <span style="color:var(--text-muted);font-size:var(--text-xs)">${s.duration} min</span>
                <span class="badge badge-gray" style="font-size:10px">${UI.fmt.recurrence(s.recurrence)}</span>
              </div>
              <div style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-2)">
                Students: ${students.map(st => `<strong>${st.name}</strong>`).join(', ')}
              </div>
              ${s.notes ? `<div style="font-size:var(--text-xs);color:var(--text-muted);padding:var(--space-2) var(--space-3);background:rgba(255,255,255,0.02);border-radius:var(--radius-sm);border:1px solid var(--border)">📝 ${s.notes}</div>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;gap:var(--space-2);align-items:flex-end">
              ${tab === 'upcoming' ? `<a href="${s.zoomLink}" target="_blank" class="zoom-badge${accessible ? '' : ' locked'}">🎥 ${accessible ? 'Join Zoom' : 'Zoom (locked)'}</a>` : ''}
              ${tab === 'past' ? `<button class="btn btn-${hasAtt ? 'secondary' : 'primary'} btn-sm" onclick="window._pendingAttendanceSession='${s.id}';Router.navigate('teacher-attendance')">
                ${hasAtt ? '✓ View Attendance' : '⚠ Mark Attendance'}
              </button>` : ''}
              ${hasAtt && tab === 'past' ? renderMiniAttendance(att, students) : ''}
            </div>
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function renderMiniAttendance(att, students) {
  return `<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;max-width:200px">
    ${students.map(st => {
      const a = att.find(a => a.studentId === st.id);
      const statusMap = { present: { icon: '✓', cls: 'success' }, absent: { icon: '✕', cls: 'danger' }, late: { icon: '⏱', cls: 'warning' } };
      const sm = a ? (statusMap[a.status]||{icon:'?',cls:'gray'}) : {icon:'?',cls:'gray'};
      return `<span class="badge badge-${sm.cls}" style="font-size:9px">${sm.icon} ${st.name.split(' ')[0]}</span>`;
    }).join('')}
  </div>`;
}

/* ── Attendance Page ── */
Router.register('teacher-attendance', function(container) {
  const teacherId = Auth.getRefId();
  const sessions = DB.getSessions({ teacherId, status: 'completed' });
  const selectedId = window._pendingAttendanceSession || (sessions[0]?.id);

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">Mark Attendance</h2>
        <p class="section-subtitle">Record student attendance for completed sessions</p>
      </div>
    </div>

    <div class="dash-grid-3">
      <!-- Session Selector -->
      <div class="content-card" style="grid-column:span 1">
        <div class="card-header"><span class="card-title">📋 Sessions</span></div>
        <div style="max-height:500px;overflow-y:auto">
          ${sessions.length === 0 ? '<div class="empty-state" style="padding:var(--space-8)"><p>No completed sessions yet</p></div>' :
          sessions.map(s => {
            const att = DB.getAttendance({ sessionId: s.id });
            const isSelected = s.id === selectedId;
            return `<div class="session-card" style="border-radius:0;border-left:none;border-right:none;border-top:none;${isSelected ? 'background:rgba(201,168,76,0.07);border-bottom-color:var(--border-gold)' : ''}"
              onclick="selectAttendanceSession('${s.id}')">
              <div class="session-time-block">
                <div class="session-time">${UI.fmt.dateShort(s.date)}</div>
                <div class="session-duration">${UI.fmt.time(s.time)}</div>
              </div>
              <div class="session-divider"></div>
              <div class="session-info">
                <div class="session-title">${s.courseType}</div>
                <div class="session-meta">${s.studentIds.length} student(s)</div>
              </div>
              <span class="badge badge-${att.length > 0 ? 'success' : 'warning'}">${att.length > 0 ? '✓' : '!'}</span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Attendance Form -->
      <div class="content-card" id="att-form-card" style="grid-column:span 1">
        ${selectedId ? renderAttendanceForm(selectedId) : '<div class="empty-state"><p class="empty-state-title">Select a session</p></div>'}
      </div>
    </div>
  `;
});

window.selectAttendanceSession = function(sessionId) {
  window._pendingAttendanceSession = sessionId;
  const card = document.getElementById('att-form-card');
  if (card) card.innerHTML = renderAttendanceForm(sessionId);
};

function renderAttendanceForm(sessionId) {
  const session = DB.getSession(sessionId);
  if (!session) return '<div class="empty-state"><p>Session not found</p></div>';
  const students = session.studentIds.map(id => DB.getStudent(id)).filter(Boolean);
  const existingAtt = DB.getAttendance({ sessionId });

  return `<div class="card-header">
    <div>
      <span class="card-title">${session.courseType} · ${UI.fmt.date(session.date)}</span>
      <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px">${UI.fmt.time(session.time)} · ${session.duration}min</div>
    </div>
    ${UI.badge(...UI.fmt.sessionStatus(session.status))}
  </div>
  <div class="card-body">
    <div class="attendance-form" id="att-form-${sessionId}">
      ${students.map(st => {
        const existing = existingAtt.find(a => a.studentId === st.id);
        const currentStatus = existing?.status || 'present';
        return `<div class="attendance-row">
          <div class="att-student-info">
            ${UI.avatar(st.name, 'avatar avatar-sm')}
            <div>
              <div class="att-student-name">${st.name}</div>
              <div class="att-student-code">${st.id}</div>
            </div>
          </div>
          <div class="att-radio-group">
            <input class="att-radio" type="radio" name="att-${st.id}" id="att-${st.id}-present" value="present" ${currentStatus==='present'?'checked':''}>
            <label class="att-radio-label present" for="att-${st.id}-present">Present</label>
            <input class="att-radio" type="radio" name="att-${st.id}" id="att-${st.id}-late" value="late" ${currentStatus==='late'?'checked':''}>
            <label class="att-radio-label late" for="att-${st.id}-late">Late</label>
            <input class="att-radio" type="radio" name="att-${st.id}" id="att-${st.id}-absent" value="absent" ${currentStatus==='absent'?'checked':''}>
            <label class="att-radio-label absent" for="att-${st.id}-absent">Absent</label>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="form-group" style="margin-top:var(--space-4)">
      <label class="form-label">Session Notes</label>
      <textarea class="form-input-plain" id="att-notes-${sessionId}" placeholder="Progress notes, areas to improve..." style="min-height:80px">${session.notes||''}</textarea>
    </div>
    <div style="margin-top:var(--space-4);display:flex;gap:var(--space-3)">
      <button class="btn btn-primary w-full" onclick="submitAttendance('${sessionId}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        Save Attendance
      </button>
    </div>
  </div>`;
}

window.submitAttendance = async function(sessionId) {
  const session = DB.getSession(sessionId);
  const students = session.studentIds.map(id => DB.getStudent(id)).filter(Boolean);
  const records = students.map(st => {
    const radio = document.querySelector(`input[name="att-${st.id}"]:checked`);
    return { studentId: st.id, status: radio ? radio.value : 'present', notes: '' };
  });
  const notes = document.getElementById(`att-notes-${sessionId}`)?.value || '';
  await DB.markAttendance(sessionId, records);
  await DB.updateSession(sessionId, { notes });
  UI.toast('Attendance saved successfully! ✓', 'success');
  // Refresh the form to show updated state
  selectAttendanceSession(sessionId);
};
