/* ================================================
   TEACHER ATTENDANCE STANDALONE PAGE (registered separately)
   ================================================ */
// teacher-attendance.js is a standalone page registration
Router.register('teacher-attendance', function(container) {
  const teacherId = Auth.getRefId();
  const sessions = DB.getSessions({ teacherId, status: 'completed' });
  const selectedId = window._pendingAttendanceSession || (sessions.length ? sessions[sessions.length-1].id : null);
  window._pendingAttendanceSession = null;

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">Attendance Management</h2>
        <p class="section-subtitle">Mark and review attendance for your sessions</p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:280px 1fr;gap:var(--space-6)">
      <!-- Session Selector (scrollable) -->
      <div class="content-card" style="max-height:calc(100vh - 200px);display:flex;flex-direction:column">
        <div class="card-header" style="flex-shrink:0"><span class="card-title">Select Session</span></div>
        <div style="overflow-y:auto;flex:1">
          ${sessions.length === 0 ? '<div class="empty-state" style="padding:var(--space-6)"><p class="empty-state-title">No completed sessions</p></div>' :
          sessions.slice().reverse().map(s => {
            const att = DB.getAttendance({ sessionId: s.id });
            const isSelected = s.id === selectedId;
            return `<div style="padding:var(--space-3) var(--space-4);border-bottom:1px solid var(--border);cursor:pointer;transition:background var(--transition-fast);${isSelected?'background:rgba(201,168,76,0.07)':''}"
              onmouseenter="this.style.background='rgba(255,255,255,0.03)'" onmouseleave="this.style.background='${isSelected?'rgba(201,168,76,0.07)':''}'"
              onclick="selectAttendanceSession('${s.id}')">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div>
                  <div style="font-size:var(--text-sm);font-weight:600">${s.courseType}</div>
                  <div style="font-size:var(--text-xs);color:var(--text-muted)">${UI.fmt.date(s.date)} · ${UI.fmt.time(s.time)}</div>
                </div>
                ${att.length > 0 ? '<span class="badge badge-success" style="font-size:10px">✓ Done</span>' : '<span class="badge badge-warning" style="font-size:10px">Pending</span>'}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Attendance Form -->
      <div id="att-form-card">
        ${selectedId ? renderAttendanceForm(selectedId) : `<div class="content-card"><div class="empty-state" style="padding:var(--space-12)"><div class="empty-state-icon">👆</div><p class="empty-state-title">Select a session to mark attendance</p></div></div>`}
      </div>
    </div>
  `;
});
