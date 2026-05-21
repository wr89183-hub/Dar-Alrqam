/* ================================================
   TEACHER DASHBOARD PAGE
   ================================================ */
Router.register('teacher-dashboard', function(container) {
  const teacherId = Auth.getRefId();
  const teacher = DB.getTeacher(teacherId);
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0,7); // YYYY-MM
  
  const allSessions = DB.getSessions({ teacherId });
  const todaySessions = DB.getSessions({ teacherId, date: today });
  const upcoming = allSessions.filter(s => s.status === 'upcoming').slice(0, 10);
  
  const completedThisMonth = allSessions.filter(s => s.status === 'completed' && s.date.startsWith(currentMonth)).length;
  const cancelledThisMonth = allSessions.filter(s => s.status === 'cancelled' && s.date.startsWith(currentMonth)).length;
  const completedAllTime = allSessions.filter(s => s.status === 'completed').length;
  
  const nextSession = upcoming.find(s => `${s.date}T${s.time}` > new Date().toISOString().slice(0,16)) || upcoming[0];

  // Calculate unique student count instead of names
  const uniqueStudents = new Set();
  allSessions.forEach(s => s.studentIds.forEach(id => uniqueStudents.add(id)));
  const assignedStudentsCount = uniqueStudents.size;

  // Rate
  const rate = teacher ? (teacher.sessionRate || 100) : 100;

  // Render function that applies the date filter
  function renderDashboard(fromDate = null, toDate = null) {
    let filteredSessions = allSessions;
    if (fromDate) filteredSessions = filteredSessions.filter(s => s.date >= fromDate);
    if (toDate) filteredSessions = filteredSessions.filter(s => s.date <= toDate);
    
    const fCompleted = filteredSessions.filter(s => s.status === 'completed').length;
    const fCancelled = filteredSessions.filter(s => s.status === 'cancelled').length;
    const fUpcoming  = filteredSessions.filter(s => s.status === 'upcoming').length;
    
    const earnedPeriod = fCompleted * rate;
    const earnedAllTime = completedAllTime * rate;

    // History calculation
    const monthHist = {};
    allSessions.filter(s => s.status === 'completed').forEach(s => {
      const ym = s.date.substring(0,7);
      if (!monthHist[ym]) monthHist[ym] = 0;
      monthHist[ym]++;
    });
    const historyHtml = Object.keys(monthHist).sort().reverse().map(ym => {
        return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
            <span style="color:var(--text-secondary)">${UI.fmt.month(ym)}</span>
            <span style="font-weight:bold;color:var(--success)">${monthHist[ym] * rate} EGP</span>
        </div>`;
    }).join('');

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:var(--space-4);">
        <h2 style="font-size:24px; font-weight:800;">Billing & Overview</h2>
        <div style="display:flex; gap:8px;">
          <input type="date" id="td-date-from" class="form-input-plain" style="height:36px;width:140px" value="${fromDate||''}">
          <input type="date" id="td-date-to" class="form-input-plain" style="height:36px;width:140px" value="${toDate||''}">
          <button class="btn btn-secondary btn-sm" onclick="applyTeacherFilter()">Filter</button>
          <button class="btn btn-ghost btn-sm" onclick="clearTeacherFilter()">Clear</button>
        </div>
      </div>
    <div class="stats-grid" style="margin-bottom:var(--space-6)">
      <div class="stat-card blue" style="padding:var(--space-4) var(--space-5)">
        <div class="stat-label">Total Assigned Students</div>
        <div class="stat-value" style="font-size:var(--text-2xl)">${assignedStudentsCount}</div>
        <div class="stat-change" style="color:var(--text-muted)">Across all sessions</div>
      </div>
      <div class="stat-card teal" style="padding:var(--space-4) var(--space-5)">
        <div class="stat-label">Completed (Selected Period)</div>
        <div class="stat-value" style="font-size:var(--text-2xl)">${fCompleted}</div>
        <div class="stat-change up">Sessions</div>
      </div>
      <div class="stat-card red" style="padding:var(--space-4) var(--space-5)">
        <div class="stat-label">Cancelled (Selected Period)</div>
        <div class="stat-value" style="font-size:var(--text-2xl)">${fCancelled}</div>
        <div class="stat-change down">Sessions</div>
      </div>
      <div class="stat-card gold" style="padding:var(--space-4) var(--space-5)">
        <div class="stat-label">Upcoming (Selected Period)</div>
        <div class="stat-value" style="font-size:var(--text-2xl)">${fUpcoming}</div>
        <div class="stat-change" style="color:var(--text-muted)">Pending</div>
      </div>
    </div>

    <!-- Next Session Banner -->
    ${nextSession ? `<div class="next-session-banner" style="margin-bottom:var(--space-6)">
      <div>
        <div class="next-session-label">⚡ Next Session</div>
        <div class="next-session-name">${nextSession.courseType} Class</div>
        <div class="next-session-time">${UI.fmt.date(nextSession.date)} at ${UI.fmt.time(nextSession.time)} · ${nextSession.duration} min</div>
        <div style="margin-top:var(--space-3);display:flex;gap:var(--space-2)">
          <a href="${nextSession.zoomLink}" target="_blank" class="zoom-badge${UI.fmt.isZoomAccessible(nextSession.date, nextSession.time) ? '' : ' locked'}">
            🎥 <span>${UI.fmt.isZoomAccessible(nextSession.date, nextSession.time) ? 'Join Zoom Now' : 'Zoom link • Available 15min before'}</span>
          </a>
        </div>
      </div>
      <div class="next-session-countdown">
        <div class="countdown-time" id="teacher-countdown">--:--:--</div>
        <div class="countdown-sub">until session starts</div>
      </div>
    </div>` : ''}

    <div class="dash-grid-2">
      <!-- Upcoming Sessions List -->
      <div class="content-card">
        <div class="card-header">
          <span class="card-title">⏳ Upcoming Sessions</span>
          <button class="btn btn-ghost btn-sm" onclick="Router.navigate('teacher-sessions')">View All</button>
        </div>
        <div class="card-body session-list">
          ${upcoming.slice(0, 6).map(s => {
            const timeUntil = UI.fmt.timeUntil(s.date, s.time);
            return `<div class="session-card">
              <div class="session-time-block">
                <div class="session-time">${UI.fmt.time(s.time)}</div>
                <div class="session-duration">${UI.fmt.dateShort(s.date)}</div>
              </div>
              <div class="session-divider"></div>
              <div class="session-info">
                <div class="session-title">${s.courseType}</div>
                <!-- Privacy Edit: Showing count only -->
                <div class="session-meta">${s.duration} mins · ${s.studentIds.length} student(s)</div>
              </div>
              ${timeUntil ? `<span style="font-size:var(--text-xs);color:var(--gold-300);font-weight:600;white-space:nowrap">in ${timeUntil}</span>` : ''}
            </div>`;
          }).join('')}
          ${upcoming.length === 0 ? `<p style="padding: 24px; text-align:center; color:var(--text-muted)">No upcoming sessions.</p>` : ''}
        </div>
      </div>

      <!-- Salary & Payments Section -->
      <div class="content-card">
        <div class="card-header">
          <span class="card-title">💳 Salary & Billing Settings</span>
        </div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:var(--space-4)">
          <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--border)">
            <span style="color:var(--text-secondary)">Rate per session</span>
            <span style="font-weight:bold">${rate} EGP</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--border)">
            <span style="color:var(--text-secondary)">Total Earned (Filtered)</span>
            <span style="font-weight:bold;color:var(--success)">${earnedPeriod} EGP</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--border)">
            <span style="color:var(--text-secondary)">Total Earned (All Time)</span>
            <span style="font-weight:bold">${earnedAllTime} EGP</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:16px;background:var(--surface-hover);border-radius:8px">
            <span style="font-weight:500;color:var(--gold-300)">Available Balance</span>
            <span style="font-size:24px;font-weight:bold;color:var(--gold-300)" id="teacher-balance-display">... EGP</span>
          </div>
          
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn btn-primary" id="btn-request-withdrawal" style="flex:1">Withdraw Funds</button>
            <button class="btn btn-secondary" onclick="generateTeacherInvoicePDF('${teacherId}', '${fromDate||''}', '${toDate||''}')" style="flex:1">📄 Download Invoice PDF</button>
          </div>
          
          <div style="margin-top:16px;">
            <div style="font-size:12px; font-weight:bold; color:var(--text-muted); margin-bottom:8px;">EARNINGS HISTORY</div>
            <div style="max-height:150px; overflow-y:auto; padding-right:8px;">
                ${historyHtml || '<div style="color:var(--text-muted);font-size:12px">No history yet.</div>'}
            </div>
          </div>
        </div>
      </div>

      <!-- Evaluations & Progress Section -->
      <div class="content-card" style="grid-column: 1 / -1;">
        <div class="card-header" style="justify-content:space-between">
          <span class="card-title">📝 Student Progress Reports</span>
          <button class="btn btn-primary btn-sm" onclick="openSubmitEvaluationModal()">➕ Submit Evaluation</button>
        </div>
        <div class="card-body-flush table-wrapper">
          <table class="data-table">
            <thead>
              <tr><th>Month</th><th>Student</th><th>Course</th><th>Recitation</th><th>Memorization</th><th>Tajweed</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${DB.getEvaluations({ teacherId }).slice().reverse().slice(0, 10).map(e => {
                const stu = DB.getStudent(e.studentId);
                return `<tr>
                  <td>${UI.fmt.month(e.month)}</td>
                  <td style="font-weight:bold">${stu ? stu.name : e.studentId}</td>
                  <td><span class="badge badge-gray">${e.courseType}</span></td>
                  <td style="color:${e.recitationScore >= 8 ? 'var(--success)' : e.recitationScore >= 5 ? 'var(--warning)' : 'var(--danger)'};font-weight:bold">${e.recitationScore}/10</td>
                  <td style="color:${e.memorizationScore >= 8 ? 'var(--success)' : e.memorizationScore >= 5 ? 'var(--warning)' : 'var(--danger)'};font-weight:bold">${e.memorizationScore}/10</td>
                  <td style="color:${e.tajweedScore >= 8 ? 'var(--success)' : e.tajweedScore >= 5 ? 'var(--warning)' : 'var(--danger)'};font-weight:bold">${e.tajweedScore}/10</td>
                  <td><button class="btn btn-ghost btn-sm" onclick="alert('Notes: ' + '${e.notes.replace(/'/g, "\\'")}')">View Notes</button></td>
                </tr>`;
              }).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No evaluations submitted yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

    // Countdown timer resets when rendering
    if (nextSession) {
      updateTeacherCountdown(nextSession.date, nextSession.time);
      if (window._teacherCdTimer) clearInterval(window._teacherCdTimer);
      window._teacherCdTimer = setInterval(() => {
        if (!document.getElementById('teacher-countdown')) { clearInterval(window._teacherCdTimer); return; }
        updateTeacherCountdown(nextSession.date, nextSession.time);
      }, 1000);
    }
    
    fetchSalaryData(earnedAllTime);
  }

  // Render initial (no filter)
  renderDashboard(null, null);

  window.applyTeacherFilter = function() {
    renderDashboard(document.getElementById('td-date-from').value, document.getElementById('td-date-to').value);
  };
  window.clearTeacherFilter = function() {
    renderDashboard(null, null);
  };

  // Countdown timer
  if (nextSession) {
    updateTeacherCountdown(nextSession.date, nextSession.time);
    const timer = setInterval(() => {
      if (!document.getElementById('teacher-countdown')) { clearInterval(timer); return; }
      updateTeacherCountdown(nextSession.date, nextSession.time);
    }, 1000);
  }

  // Fetch logic for balance
  async function fetchSalaryData(earnedAllTimeLocal) {
    const { data: withdrawals } = await window.supabaseClient
        .from('withdrawals')
        .select('amount, status')
        .eq('teacher_id', teacherId);
    
    let totalWithdrawn = 0;
    if (withdrawals) {
      withdrawals.forEach(w => totalWithdrawn += w.amount);
    }
    const availableBalance = earnedAllTimeLocal - totalWithdrawn;
    const balEl = document.getElementById('teacher-balance-display');
    if(balEl) balEl.textContent = availableBalance + ' EGP';

    const btnReq = document.getElementById('btn-request-withdrawal');
    if (btnReq) {
      if (availableBalance <= 0) {
        btnReq.disabled = true;
        btnReq.textContent = "No balance available";
      } else {
        btnReq.onclick = async () => {
          btnReq.disabled = true;
          btnReq.innerHTML = '<span class="spinner"></span> Requesting...';
          const { error } = await window.supabaseClient.from('withdrawals').insert([{
             id: 'WDW-' + Date.now(),
             teacher_id: teacherId,
             amount: availableBalance,
             status: 'pending'
          }]);
          if(error) {
             UI.toast("Failed to request: " + error.message, 'error');
             btnReq.disabled = false;
             btnReq.textContent = "Request Withdrawal";
          } else {
             UI.toast("Withdrawal requested successfully!", 'success');
             btnReq.textContent = "Request Pending";
             balEl.textContent = '0 EGP';
          }
        };
      }
    }
  }

function updateTeacherCountdown(date, time) {
  const el = document.getElementById('teacher-countdown');
  if (!el) return;
  const { past, text } = UI.fmt.countdown(date, time);
  el.textContent = past ? 'In session' : text;
  if (past) el.style.color = 'var(--success)';
}

window.goMarkAttendance = function(sessionId) {
  window._pendingAttendanceSession = sessionId;
  Router.navigate('teacher-attendance');
};

// Evaluations Modal Logic
window.openSubmitEvaluationModal = function() {
  const teacherId = Auth.getRefId();
  // Get unique students currently taught
  const allSessions = DB.getSessions({ teacherId });
  const myStudents = new Map();
  allSessions.forEach(s => {
     s.studentIds.forEach(id => {
         const st = DB.getStudent(id);
         if (st) myStudents.set(id, { id, name: st.name, course: s.courseType });
     });
  });

  const studentsHtml = Array.from(myStudents.values()).map(s => 
     `<option value="${s.id}|${s.course}">${s.name} (${s.course})</option>`
  ).join('');

  if (myStudents.size === 0) {
      UI.toast("You have no assigned students to evaluate.", "error");
      return;
  }

  const currentMonth = new Date().toISOString().slice(0,7);

  UI.openModal('Submit Progress Report', `
    <div class="form-group">
      <label class="form-label">Select Student & Course</label>
      <select class="form-input-plain" id="ev-student">
         ${studentsHtml}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Evaluation Month</label>
      <input type="month" class="form-input-plain" id="ev-month" value="${currentMonth}" max="${currentMonth}">
    </div>
    
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-top:24px;">
      <div class="form-group">
        <label class="form-label" style="text-align:center;">Recitation (1-10)</label>
        <input type="number" class="form-input-plain" id="ev-rec" min="1" max="10" placeholder="e.g. 9" style="text-align:center; font-size:20px; font-weight:bold; height:50px;" />
      </div>
      <div class="form-group">
        <label class="form-label" style="text-align:center;">Memorization (1-10)</label>
        <input type="number" class="form-input-plain" id="ev-mem" min="1" max="10" placeholder="e.g. 8" style="text-align:center; font-size:20px; font-weight:bold; height:50px;" />
      </div>
      <div class="form-group">
        <label class="form-label" style="text-align:center;">Tajweed (1-10)</label>
        <input type="number" class="form-input-plain" id="ev-taj" min="1" max="10" placeholder="e.g. 9" style="text-align:center; font-size:20px; font-weight:bold; height:50px;" />
      </div>
    </div>

    <div class="form-group" style="margin-top:16px;">
      <label class="form-label">Teacher's Notes (Feedback for Family)</label>
      <textarea class="form-input-plain" id="ev-notes" placeholder="Great improvement in Tajweed this month..." style="min-height:80px;"></textarea>
    </div>

    <div class="form-actions" style="margin-top:24px;">
      <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitEvaluation()">Submit Evaluation</button>
    </div>
  `);
};

window.submitEvaluation = async function() {
  const stData = document.getElementById('ev-student').value.split('|');
  const studentId = stData[0];
  const courseType = stData[1];
  const month = document.getElementById('ev-month').value;
  const recitationScore = parseInt(document.getElementById('ev-rec').value);
  const memorizationScore = parseInt(document.getElementById('ev-mem').value);
  const tajweedScore = parseInt(document.getElementById('ev-taj').value);
  const notes = document.getElementById('ev-notes').value.trim();

  if (!month || isNaN(recitationScore) || isNaN(memorizationScore) || isNaN(tajweedScore)) {
      UI.toast("Please fill out all scores logically (1-10).", "error");
      return;
  }

  if (recitationScore < 1 || recitationScore > 10 || memorizationScore < 1 || memorizationScore > 10 || tajweedScore < 1 || tajweedScore > 10) {
      UI.toast("Scores must be between 1 and 10.", "error");
      return;
  }

  UI.toast("Submitting evaluation...", "info");
  
  await DB.addEvaluation({
     studentId,
     teacherId: Auth.getRefId(),
     courseType,
     month,
     recitationScore,
     memorizationScore,
     tajweedScore,
     notes
  });

  UI.closeModal();
  UI.toast("Evaluation submitted successfully!", "success");
  
  // Re-render tab if on it
  if(window.clearTeacherFilter) {
      // Retrigger the generic rendering
      window.clearTeacherFilter();
  }
};
});
