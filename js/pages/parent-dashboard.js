/* ================================================
   PARENT DASHBOARD PAGE
   ================================================ */
Router.register('parent-dashboard', function(container) {
  const familyId = Auth.getRefId();
  const family   = DB.getFamily(familyId);
  const children = DB.getStudents({ familyId });
  const payments = DB.getPayments({ familyId });
  const paidTotal   = payments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.amount,0);
  const pending     = payments.filter(p=>p.status==='pending'||p.status==='overdue');
  const currentMonth = new Date().toISOString().slice(0,7);
  const currentPay = payments.find(p => p.month === currentMonth);

  let selectedChildId = children[0]?.id;

  function renderContent() {
    const child = children.find(c => c.id === selectedChildId) || children[0];
    if (!child) return '<div class="empty-state"><p>No children registered</p></div>';
    const childSessions = DB.getSessions({ studentId: child.id });
    const childAtt = DB.getAttendance({ studentId: child.id });
    const present = childAtt.filter(a=>a.status==='present').length;
    const attRate = childAtt.length ? Math.round((present/childAtt.length)*100) : 0;
    const upcoming = childSessions.filter(s=>s.status==='upcoming').slice(0,5);

    return `
      <!-- Family Header -->
      <div class="dashboard-welcome" style="margin-bottom:var(--space-6)">
        <div>
          <p class="welcome-greeting">مرحباً بكم 👋</p>
          <h2 class="welcome-name">${family ? family.name : Auth.getName()}</h2>
          <p class="welcome-time">${children.length} enrolled children · ${UI.fmt.currency(family?.monthlyFee||0)}/month</p>
        </div>
        <div class="welcome-stats">
          <div class="welcome-stat-item">
            <div class="welcome-stat-value">${children.length}</div>
            <div class="welcome-stat-label">Children</div>
          </div>
          <div class="welcome-stat-item">
            <div class="welcome-stat-value">${currentPay?.status === 'paid' ? '✓' : '!'}</div>
            <div class="welcome-stat-label">${currentPay?.status === 'paid' ? 'Paid' : 'Due'}</div>
          </div>
          <div class="welcome-stat-item">
            <div class="welcome-stat-value">${UI.fmt.currency(paidTotal)}</div>
            <div class="welcome-stat-label">Total Paid</div>
          </div>
        </div>
      </div>

      <!-- Child Tabs -->
      <div class="family-children-tabs" id="child-tabs">
        ${children.map(c => `<button class="child-tab${c.id===selectedChildId?' active':''}" onclick="selectChild('${c.id}')">
          ${UI.avatar(c.name,'avatar avatar-sm')} ${c.name.split(' ')[0]}
        </button>`).join('')}
      </div>

      <!-- Child Info -->
      <div class="dash-grid-2" style="margin-bottom:var(--space-6)">
        <div class="content-card">
          <div class="card-header">
            <span class="card-title">${UI.avatar(child.name, 'avatar')} ${child.name}</span>
            ${UI.badge(child.status === 'active' ? 'Active' : 'Inactive', child.status === 'active' ? 'success' : 'danger')}
          </div>
          <div class="card-body">
            <div class="info-row"><span class="info-row-label">Student Code</span><span class="info-row-value" style="color:var(--gold-300);font-weight:700">${child.id}</span></div>
            <div class="info-row"><span class="info-row-label">Age / Grade</span><span class="info-row-value">${child.age} years / ${child.grade}</span></div>
            <div class="info-row"><span class="info-row-label">Courses</span><span class="info-row-value">${child.courses.map(c=>`<span class="badge badge-${UI.fmt.courseColor(c)}">${c}</span>`).join(' ')}</span></div>
            <div class="info-row"><span class="info-row-label">Joined</span><span class="info-row-value">${UI.fmt.date(child.joinDate)}</span></div>
            <div style="margin-top:var(--space-4)">
              <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-1);font-size:var(--text-sm)">
                <span>Attendance Rate</span>
                <span style="font-weight:800;color:${attRate>=80?'var(--success)':attRate>=60?'var(--warning)':'var(--danger)'}">${attRate}%</span>
              </div>
              <div class="progress-bar-wrap" style="height:8px">
                <div class="progress-bar-fill ${attRate>=80?'progress-green':attRate>=60?'progress-gold':'progress-red'}" style="width:${attRate}%"></div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-2);margin-top:var(--space-4)">
                <div class="att-summary-card" style="padding:var(--space-2)"><div style="font-size:var(--text-lg);font-weight:800;color:var(--success)">${present}</div><div class="att-summary-label">Present</div></div>
                <div class="att-summary-card" style="padding:var(--space-2)"><div style="font-size:var(--text-lg);font-weight:800;color:var(--danger)">${childAtt.filter(a=>a.status==='absent').length}</div><div class="att-summary-label">Absent</div></div>
                <div class="att-summary-card" style="padding:var(--space-2)"><div style="font-size:var(--text-lg);font-weight:800;color:var(--warning)">${childAtt.filter(a=>a.status==='late').length}</div><div class="att-summary-label">Late</div></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Sessions for Child -->
        <div class="content-card">
          <div class="card-header"><span class="card-title">📅 Upcoming Sessions</span></div>
          <div class="card-body session-list">
            ${upcoming.length === 0 ? '<div class="empty-state" style="padding:var(--space-6)"><p class="empty-state-title">No upcoming sessions</p></div>' :
            upcoming.map(s => {
              const teacher = DB.getTeacher(s.teacherId);
              const accessible = UI.fmt.isZoomAccessible(s.date, s.time);
              return `<div class="session-card">
                <div class="session-time-block">
                  <div class="session-time">${UI.fmt.time(s.time)}</div>
                  <div class="session-duration">${UI.fmt.dateShort(s.date)}</div>
                </div>
                <div class="session-divider"></div>
                <div class="session-info">
                  <div class="session-title">${s.courseType}</div>
                  <div class="session-meta">👨‍🏫 ${teacher ? teacher.name.replace('Ustadh ','').replace('Ustadha ','') : '—'}</div>
                </div>
                <a href="${s.zoomLink}" target="_blank" class="zoom-badge${accessible?'':' locked'}" style="font-size:10px">🎥</a>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Billing Summary -->
      <div class="content-card">
        <div class="card-header">
          <span class="card-title">💳 Billing & Payments</span>
          <span class="badge badge-${family?.plan==='premium'?'gold':family?.plan==='standard'?'teal':'gray'}">${family?.plan || 'standard'} plan</span>
        </div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-4);margin-bottom:var(--space-5)">
            <div class="finance-metric" style="border-color:rgba(46,204,113,0.2)">
              <div class="finance-metric-label">Monthly Fee</div>
              <div class="finance-metric-value text-success">${UI.fmt.currency(family?.monthlyFee||0)}</div>
            </div>
            <div class="finance-metric" style="border-color:rgba(201,168,76,0.3)">
              <div class="finance-metric-label">Total Paid</div>
              <div class="finance-metric-value text-accent">${UI.fmt.currency(paidTotal)}</div>
            </div>
            <div class="finance-metric" style="border-color:rgba(${pending.length > 0 ? '231,76,60' : '46,204,113'},0.2)">
              <div class="finance-metric-label">Balance Due</div>
              <div class="finance-metric-value ${pending.length > 0 ? 'text-danger' : 'text-success'}">${pending.length > 0 ? UI.fmt.currency(pending.reduce((s,p)=>s+p.amount,0)) : '✓ Clear'}</div>
            </div>
          </div>

          <!-- Recent Payments -->
          <div class="table-wrapper">
            <table class="data-table">
              <thead><tr><th>Month</th><th>Amount</th><th>Status</th><th>Paid Date</th></tr></thead>
              <tbody>
                ${payments.slice().reverse().slice(0,6).map(p => {
                  const [sl, sc] = [
                    {paid:['Paid','success'],pending:['Pending','warning'],overdue:['Overdue','danger']}[p.status] || ['Unknown','gray']
                  ][0];
                  return `<tr>
                    <td style="font-weight:600">${UI.fmt.month(p.month)}</td>
                    <td style="color:var(--success);font-weight:700">${UI.fmt.currency(p.amount)}</td>
                    <td>${UI.badge(sl, sc)}</td>
                    <td style="color:var(--text-muted)">${p.paidDate ? UI.fmt.date(p.paidDate) : '—'}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  }

  container.innerHTML = renderContent();

  window.selectChild = function(childId) {
    selectedChildId = childId;
    container.innerHTML = renderContent();
  };
});

Router.register('parent-schedule', function(container) {
  const familyId = Auth.getRefId();
  const children = DB.getStudents({ familyId });
  const allSessions = [];
  children.forEach(c => {
    const sessions = DB.getSessions({ studentId: c.id, status: 'upcoming' });
    sessions.forEach(s => allSessions.push({ ...s, studentName: c.name }));
  });
  allSessions.sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">Family Schedule</h2>
        <p class="section-subtitle">All upcoming sessions for ${children.map(c=>c.name.split(' ')[0]).join(', ')}</p>
      </div>
    </div>
    <div class="content-card">
      <div class="card-body-flush">
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Student</th><th>Course</th><th>Date</th><th>Time</th><th>Teacher</th><th>Duration</th><th>Zoom</th></tr></thead>
            <tbody>
              ${allSessions.map(s => {
                const teacher = DB.getTeacher(s.teacherId);
                const accessible = UI.fmt.isZoomAccessible(s.date, s.time);
                return `<tr>
                  <td style="font-weight:600">${s.studentName}</td>
                  <td><span class="badge badge-${UI.fmt.courseColor(s.courseType)}">${s.courseType}</span></td>
                  <td style="font-weight:600">${UI.fmt.date(s.date)}</td>
                  <td style="color:var(--gold-300);font-weight:600">${UI.fmt.time(s.time)}</td>
                  <td style="font-size:var(--text-sm)">${teacher ? teacher.name.replace('Ustadh ','').replace('Ustadha ','') : '—'}</td>
                  <td style="color:var(--text-muted)">${s.duration}m</td>
                  <td><a href="${s.zoomLink}" target="_blank" class="zoom-badge${accessible?'':' locked'}" style="font-size:10px">🎥 ${accessible?'Join':'Locked'}</a></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
});

Router.register('parent-billing', function(container) {
  const familyId = Auth.getRefId();
  const family   = DB.getFamily(familyId);
  const payments = DB.getPayments({ familyId });
  const pending  = payments.filter(p => p.status !== 'paid');

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">Billing</h2>
        <p class="section-subtitle">${family?.plan || 'Standard'} plan · ${UI.fmt.currency(family?.monthlyFee||0)}/month</p>
      </div>
      ${pending.length > 0 ? `<button class="btn btn-primary" onclick="UI.toast('Payment portal coming in Phase 3!','info')">💳 Pay Now</button>` : ''}
    </div>
    <div class="content-card">
      <div class="card-body-flush">
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Month</th><th>Amount</th><th>Status</th><th>Paid Date</th><th>Method</th></tr></thead>
            <tbody>
              ${payments.slice().reverse().map(p => {
                const [sl, sc] = ({paid:['Paid','success'],pending:['Pending','warning'],overdue:['Overdue','danger']}[p.status]) || ['Unknown','gray'];
                const methodIcons = { bank_transfer: '🏦', stripe: '💳', cash: '💵' };
                return `<tr>
                  <td style="font-weight:600">${UI.fmt.month(p.month)}</td>
                  <td style="color:var(--success);font-weight:700">${UI.fmt.currency(p.amount)}</td>
                  <td>${UI.badge(sl, sc)}</td>
                  <td style="color:var(--text-muted)">${p.paidDate ? UI.fmt.date(p.paidDate) : '—'}</td>
                  <td style="color:var(--text-secondary)">${p.method ? `${methodIcons[p.method]||''} ${p.method.replace('_',' ')}` : '—'}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
});
