/* ================================================
   ADMIN FINANCE PAGE
   ================================================ */
Router.register('admin-finance', function(container) {
  // Initialize default filter if not set
  if (!window._finFilterType) {
    window._finFilterType = 'this_month';
    const now = new Date();
    window._finDateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    window._finDateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  }
  if (!window._financeActiveTab) {
    window._financeActiveTab = 'teachers';
  }

  renderFinancePage(container);
});

function getFinanceContainer() {
  return document.getElementById('main-content').querySelector('.page-content');
}

function updateFinanceDates() {
  const type = document.getElementById('fin-quick-filter').value;
  window._finFilterType = type;
  
  const now = new Date();
  if (type === 'this_month') {
    window._finDateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    window._finDateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  } else if (type === 'last_month') {
    window._finDateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    window._finDateTo = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
  } else if (type === 'custom') {
    // Leave custom as is, or clear it
  }
  
  if (type !== 'custom') {
     document.getElementById('fin-date-from').value = window._finDateFrom;
     document.getElementById('fin-date-to').value = window._finDateTo;
  }
}

window.applyFinanceFilter = function() {
  window._finFilterType = document.getElementById('fin-quick-filter').value;
  window._finDateFrom = document.getElementById('fin-date-from').value;
  window._finDateTo   = document.getElementById('fin-date-to').value;
  renderFinancePage(getFinanceContainer());
};

window.switchFinanceTab = function(tab) {
  window._financeActiveTab = tab;
  renderFinancePage(getFinanceContainer());
};

window.handleQuickFilterChange = function() {
  updateFinanceDates();
  if (window._finFilterType !== 'custom') {
    applyFinanceFilter();
  } else {
    renderFinancePage(getFinanceContainer());
  }
}

function renderFinancePage(container) {
  if (!container) return;
  
  const activeTab = window._financeActiveTab;
  const filterType = window._finFilterType;
  const dateFrom = window._finDateFrom;
  const dateTo = window._finDateTo;

  container.innerHTML = `
    <div class="section-header" style="flex-wrap:wrap; gap:16px;">
      <div>
        <h2 class="section-title">Financial Billing & Invoices</h2>
        <p class="section-subtitle">Manage payouts and track student revenue</p>
      </div>
      
      <!-- DATE RANGE FILTER -->
      <div style="display:flex; gap:12px; align-items:center; background:var(--surface-hover); padding:8px 16px; border-radius:var(--radius-md); border:1px solid var(--border);">
        <select id="fin-quick-filter" class="form-input-plain" style="height:36px; padding:0 8px; cursor:pointer;" onchange="handleQuickFilterChange()">
           <option value="this_month" ${filterType === 'this_month' ? 'selected' : ''}>This Month</option>
           <option value="last_month" ${filterType === 'last_month' ? 'selected' : ''}>Last Month</option>
           <option value="custom" ${filterType === 'custom' ? 'selected' : ''}>Custom Range</option>
        </select>
        
        <div style="display:${filterType === 'custom' ? 'flex' : 'none'}; gap:8px; align-items:center;">
           <input type="date" id="fin-date-from" class="form-input-plain" style="height:36px;width:130px" value="${dateFrom}">
           <span style="color:var(--text-muted)">to</span>
           <input type="date" id="fin-date-to" class="form-input-plain" style="height:36px;width:130px" value="${dateTo}">
           <button class="btn btn-secondary btn-sm" onclick="applyFinanceFilter()">Apply</button>
        </div>
      </div>
    </div>

    <!-- TABS -->
    <div class="auth-tabs" style="display:flex;gap:var(--space-2);margin-bottom:var(--space-4)">
      <button class="btn ${activeTab==='teachers'?'btn-secondary':'btn-ghost'}" style="flex:1" onclick="switchFinanceTab('teachers')">👨‍🏫 Teacher Billing (EGP)</button>
      <button class="btn ${activeTab==='students'?'btn-secondary':'btn-ghost'}" style="flex:1" onclick="switchFinanceTab('students')">🎓 Student Billing (USD)</button>
    </div>
    
    <div id="finance-tab-content">
      ${renderFinanceTabContent(activeTab, dateFrom, dateTo)}
    </div>
  `;
}

function renderFinanceTabContent(tab, fromDate, toDate) {
  if (tab === 'teachers') {
    const teachers = DB.getTeachers();
    let totalPayout = 0;
    
    const rowsHtml = teachers.map(t => {
      let sessions = DB.getSessions({ teacherId: t.id }).filter(s => s.status === 'completed');
      if (fromDate) sessions = sessions.filter(s => s.date >= fromDate);
      if (toDate) sessions = sessions.filter(s => s.date <= toDate);
      
      if (sessions.length === 0) return '';

      const compCount = sessions.length;
      const rate = t.sessionRate || 50;
      const amount = compCount * rate;
      totalPayout += amount;
      
      return `<tr>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            ${UI.avatar(t.name, 'avatar avatar-sm')}
            <div>
               <div style="font-weight:bold">${t.name}</div>
               <div style="font-size:11px;color:var(--text-muted)">${t.id}</div>
            </div>
          </div>
        </td>
        <td>${rate} EGP</td>
        <td>${compCount}</td>
        <td style="font-weight:bold;color:var(--success)">${amount} EGP</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="generateTeacherInvoicePDF('${t.id}', '${fromDate}', '${toDate}')">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px; vertical-align:middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
             PDF
          </button>
        </td>
      </tr>`;
    }).filter(row => row !== '').join('');

    return `
      <div class="content-card">
        <div class="card-header" style="justify-content:space-between;">
           <span class="card-title">Teacher Payouts</span>
           <span class="badge badge-success" style="font-size:16px;">Total Payout (This Period): ${totalPayout} EGP</span>
        </div>
        <div class="card-body-flush table-wrapper">
          <table class="data-table">
             <thead>
               <tr>
                 <th>Teacher Name</th>
                 <th>Rate/Session</th>
                 <th>Completed Sessions</th>
                 <th>Total Due (EGP)</th>
                 <th>Export Invoice</th>
               </tr>
             </thead>
             <tbody>${rowsHtml || '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-muted)">No sessions completed in this date range.</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    `;
  }
  
  if (tab === 'students') {
    const families = DB.getFamilies();
    let globalTotalDue = 0;
    
    let familiesHtml = '';

    families.forEach(f => {
      const students = DB.getStudents({familyId: f.id});
      let fTotalDue = 0;
      let hasSessions = false;
      
      const stuRows = students.map(s => {
        let sessions = DB.getSessions({ studentId: s.id }).filter(sess => sess.status === 'completed');
        if (fromDate) sessions = sessions.filter(sess => sess.date >= fromDate);
        if (toDate) sessions = sessions.filter(sess => sess.date <= toDate);
        
        if (sessions.length === 0) return '';
        
        hasSessions = true;
        const compCount = sessions.length;
        const rate = s.sessionRate || 6;
        const amount = compCount * rate;
        fTotalDue += amount;
        
        return `<tr>
          <td style="padding-left:32px;">
            <div style="font-weight:600">${s.name}</div>
          </td>
          <td><span class="badge" style="background:var(--surface-hover)">${s.id}</span></td>
          <td style="color:var(--text-muted)">${f.name}</td>
          <td>$ ${rate}</td>
          <td>${compCount} sessions</td>
          <td style="font-weight:bold">$ ${amount}</td>
          <td></td>
        </tr>`;
      }).filter(row => row !== '').join('');
      
      if (!hasSessions) return;

      globalTotalDue += fTotalDue;

      familiesHtml += `
        <tr style="background:var(--surface-hover); border-top: 2px solid var(--border);">
          <td colspan="5">
             <div style="display:flex;align-items:center;gap:12px;font-weight:bold;font-size:15px; color:var(--text-color);">
               ${UI.avatar(f.name, 'avatar avatar-sm')} ${f.name} Family
             </div>
          </td>
          <td style="font-weight:900;color:var(--gold-300);font-size:16px;">
            $ ${fTotalDue}
          </td>
          <td style="text-align:right">
             <button class="btn btn-primary btn-sm" onclick="generateStudentInvoicePDF('${f.id}', '${fromDate}', '${toDate}')">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px; vertical-align:middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
               PDF
             </button>
          </td>
        </tr>
        ${stuRows}
      `;
    });

    return `
      <div class="content-card">
        <div class="card-header" style="justify-content:space-between;">
           <span class="card-title">Student / Family Billing</span>
           <span class="badge badge-gold" style="font-size:16px;">Total Revenue Due: $ ${globalTotalDue}</span>
        </div>
        <div class="card-body-flush table-wrapper">
          <table class="data-table">
             <thead>
               <tr>
                 <th>Student Name</th>
                 <th>Code</th>
                 <th>Family</th>
                 <th>Rate/Session</th>
                 <th>Completed Sessions</th>
                 <th colspan="2">Amount Due (USD)</th>
               </tr>
             </thead>
             <tbody>${familiesHtml || '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted)">No sessions completed in this date range.</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    `;
  }
}
