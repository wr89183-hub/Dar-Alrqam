/* ================================================
   ADMIN TEACHERS PAGE
   ================================================ */
Router.register('admin-teachers', function(container) {
  renderTeachersPage(container);
});

function renderTeachersPage(container) {
  const teachers = DB.getTeachers();
  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">${window.t ? window.t('Teachers') : 'Teachers'}</h2>
        <p class="section-subtitle">${teachers.length} ${window.t ? window.t('educators on the team') : 'educators on the team'}</p>
      </div>
      <button class="btn btn-primary" onclick="openAddTeacherModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        ${window.t ? window.t('Add Teacher') : 'Add Teacher'}
      </button>
    </div>

    <!-- Teacher Cards Grid -->
    <div id="teachers-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--space-5);margin-bottom:var(--space-6)">
      ${renderTeacherCards(teachers)}
    </div>

    <!-- Teachers Table -->
    <div class="content-card">
      <div class="card-header">
        <span class="card-title">${window.t ? window.t('All Teachers') : 'All Teachers'}</span>
        <div class="search-input-wrap" style="max-width:260px">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" class="search-input" placeholder="${window.t ? window.t('Search teachers...') : 'Search teachers...'}" oninput="filterTeachersTable(this.value)" />
        </div>
      </div>
      <div class="card-body-flush">
        <div class="table-wrapper">
          <table class="data-table" id="teachers-table">
            <thead><tr>
              <th>${window.t ? window.t('Teacher') : 'Teacher'}</th><th>${window.t ? window.t('Code') : 'Code'}</th><th>${window.t ? window.t('Specialization') : 'Specialization'}</th><th>${window.t ? window.t('Sessions') : 'Sessions'}</th><th>${window.t ? window.t('Rate/Session') : 'Rate/Session'}</th><th>${window.t ? window.t('Status') : 'Status'}</th><th>${window.t ? window.t('Actions') : 'Actions'}</th>
            </tr></thead>
            <tbody>${renderTeacherRows(teachers)}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderTeacherCards(teachers) {
  return teachers.map(t => {
    const sessions = DB.getSessions({ teacherId: t.id });
    const completed = sessions.filter(s => s.status === 'completed').length;
    const upcoming  = sessions.filter(s => s.status === 'upcoming').length;
    return `<div class="content-card" style="cursor:pointer;transition:transform var(--transition-base)" onmouseenter="this.style.transform='translateY(-3px)'" onmouseleave="this.style.transform=''" onclick="viewTeacherProfile('${t.id}')">
      <div class="card-body">
        <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-4)">
          ${UI.avatar(t.name, 'avatar avatar-lg')}
          <div>
            <div style="font-weight:700;font-size:var(--text-base)">${t.name}</div>
            <div style="font-size:var(--text-xs);color:var(--gold-300);font-weight:600">${t.id}</div>
            <div style="margin-top:4px">${UI.badge(t.status === 'active' ? (window.t?window.t('Active'):'Active') : (window.t?window.t('Inactive'):'Inactive'), t.status === 'active' ? 'success' : 'danger')}</div>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:var(--space-4)">
          ${t.specialization.map(sp => `<span class="badge badge-${UI.fmt.courseColor(sp)}">${window.t?window.t(sp):sp}</span>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-2);text-align:center;padding-top:var(--space-3);border-top:1px solid var(--border)">
          <div><div style="font-size:var(--text-lg);font-weight:800;color:var(--success)">${completed}</div><div style="font-size:10px;color:var(--text-muted)">${window.t?window.t('Done'):'Done'}</div></div>
          <div><div style="font-size:var(--text-lg);font-weight:800;color:var(--gold-300)">${upcoming}</div><div style="font-size:10px;color:var(--text-muted)">${window.t?window.t('Upcoming'):'Upcoming'}</div></div>
          <div><div style="font-size:var(--text-lg);font-weight:800;color:var(--info)">${t.sessionRate} EGP</div><div style="font-size:10px;color:var(--text-muted)">${window.t?window.t('Rate'):'Rate'}</div></div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderTeacherRows(teachers) {
  if (!teachers.length) return `<tr><td colspan="7"><div class="empty-state" style="padding:var(--space-8)"><p class="empty-state-title">${window.t?window.t('No teachers found'):'No teachers found'}</p></div></td></tr>`;
  return teachers.map(t => `<tr>
    <td><div style="display:flex;align-items:center;gap:var(--space-3)">
      ${UI.avatar(t.name,'avatar avatar-sm')}
      <div>
        <div style="font-weight:600">${t.name}</div>
        <div style="font-size:var(--text-xs);color:var(--text-muted)">${t.email}</div>
      </div>
    </div></td>
    <td><code style="font-size:11px;color:var(--teal-300);background:rgba(78,205,196,0.08);padding:2px 6px;border-radius:4px">${t.id}</code></td>
    <td>${t.specialization.map(sp => `<span class="badge badge-${UI.fmt.courseColor(sp)}">${window.t?window.t(sp):sp}</span>`).join(' ')}</td>
    <td><span style="font-weight:700">${t.sessions}</span><span style="color:var(--text-muted);font-size:var(--text-xs)"> ${window.t?window.t('total'):'total'}</span></td>
    <td><span style="color:var(--success);font-weight:700">${t.sessionRate} EGP</span></td>
    <td>${UI.badge(t.status === 'active' ? (window.t?window.t('Active'):'Active') : (window.t?window.t('Inactive'):'Inactive'), t.status === 'active' ? 'success' : 'danger')}</td>
    <td>
      <div style="display:flex;gap:var(--space-1)">
        <button class="btn btn-ghost btn-sm btn-icon" title="${window.t?window.t('View'):'View'}" onclick="viewTeacherProfile('${t.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="btn btn-ghost btn-sm btn-icon" title="${window.t?window.t('Edit'):'Edit'}" onclick="openEditTeacherModal('${t.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn btn-ghost btn-sm btn-icon" title="${window.t?window.t('Remove'):'Remove'}" style="color:var(--danger)" onclick="deleteTeacherConfirm('${t.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
    </td>
  </tr>`).join('');
}

window.filterTeachersTable = function(q) {
  const teachers = DB.getTeachers({ search: q });
  const tbody = document.querySelector('#teachers-table tbody');
  if (tbody) tbody.innerHTML = renderTeacherRows(teachers);
};

window.viewTeacherProfile = function(id) {
  const t = DB.getTeacher(id);
  const sessions = DB.getSessions({ teacherId: id });
  const completed = sessions.filter(s => s.status === 'completed').length;
  const monthly = t.sessionRate * completed;
  UI.openModal(`${t.name} — ${window.t?window.t('Profile'):'Profile'}`, `
    <div style="display:flex;align-items:center;gap:var(--space-4);margin-bottom:var(--space-5);padding-bottom:var(--space-5);border-bottom:1px solid var(--border)">
      ${UI.avatar(t.name,'avatar avatar-lg')}
      <div>
        <div style="font-size:var(--text-xl);font-weight:800">${t.name}</div>
        <div style="color:var(--teal-300);font-size:var(--text-sm);font-weight:600">${t.id}</div>
        <div style="margin-top:4px">${t.specialization.map(sp => `<span class="badge badge-${UI.fmt.courseColor(sp)}">${window.t?window.t(sp):sp}</span>`).join(' ')}</div>
      </div>
    </div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Email'):'Email'}</span><span class="info-row-value">${t.email}</span></div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Session Rate'):'Session Rate'}</span><span class="info-row-value" style="color:var(--success);font-weight:700">${t.sessionRate} EGP/${window.t?window.t('session'):'session'}</span></div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Total Sessions'):'Total Sessions'}</span><span class="info-row-value">${sessions.length} (${completed} ${window.t?window.t('completed'):'completed'})</span></div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Status'):'Status'}</span><span class="info-row-value">${UI.badge(window.t?window.t(t.status==='active'?'Active':'Inactive'):t.status,'success')}</span></div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Joined'):'Joined'}</span><span class="info-row-value">${UI.fmt.date(t.joinDate)}</span></div>
    ${t.bio ? `<div class="info-row"><span class="info-row-label">${window.t?window.t('Bio'):'Bio'}</span><span class="info-row-value" style="color:var(--text-secondary)">${t.bio}</span></div>` : ''}
    <div style="margin-top:var(--space-5);padding:var(--space-4);background:var(--success-bg);border:1px solid rgba(46,204,113,0.2);border-radius:var(--radius-md)">
      <div style="font-size:var(--text-xs);color:var(--success);font-weight:700;text-transform:uppercase;letter-spacing:0.06em">${window.t?window.t('Estimated Monthly Pay'):'Estimated Monthly Pay'}</div>
      <div style="font-size:var(--text-2xl);font-weight:900;color:var(--success)">${monthly.toLocaleString()} EGP</div>
    </div>
  `);
};

window.openAddTeacherModal = function() {
  UI.openModal('Add New Teacher', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Full Name <span class="form-required">*</span></label>
        <input type="text" class="form-input-plain" id="t-name" placeholder="Ustadh..." />
      </div>
      <div class="form-group">
        <label class="form-label">Email <span class="form-required">*</span></label>
        <input type="email" class="form-input-plain" id="t-email" placeholder="teacher@nooracademy.com" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="grid-column: span 2">
        <label class="form-label">WhatsApp Number / رقم الواتساب</label>
        <input type="tel" class="form-input-plain" id="t-whatsapp" placeholder="e.g. +201012345678" />
        <div style="font-size:10px;color:var(--text-muted);margin-top:4px">For admin contact only</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Session Rate (EGP)</label>
        <input type="number" class="form-input-plain" id="t-rate" placeholder="100" min="0" />
      </div>
      <div class="form-group">
        <label class="form-label">Specialization</label>
        <div style="display:flex;gap:var(--space-3);padding-top:10px">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:var(--text-sm)"><input type="checkbox" id="ts-quran"> Quran</label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:var(--text-sm)"><input type="checkbox" id="ts-arabic"> Arabic</label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:var(--text-sm)"><input type="checkbox" id="ts-fiqh"> Fiqh</label>
        </div>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Short Bio</label>
      <textarea class="form-input-plain" id="t-bio" placeholder="Brief background..."></textarea>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewTeacher()">Add Teacher</button>
    </div>
  `);
};

window.saveNewTeacher = async function() {
  const name = document.getElementById('t-name').value.trim();
  const email = document.getElementById('t-email').value.trim();
  const whatsappNumber = document.getElementById('t-whatsapp').value.trim();
  const sessionRate = parseInt(document.getElementById('t-rate').value) || 100;
  const bio = document.getElementById('t-bio').value.trim();
  const specialization = [
    document.getElementById('ts-quran')?.checked ? 'Quran' : null,
    document.getElementById('ts-arabic')?.checked ? 'Arabic' : null,
    document.getElementById('ts-fiqh')?.checked ? 'Fiqh' : null,
  ].filter(Boolean);
  if (!name || !email) { UI.toast('Name and email are required.','error'); return; }
  
  const teacherObj = await DB.addTeacher({ name, email, whatsappNumber, sessionRate, bio, specialization });
  
  UI.toast(`${name} added as a teacher!`, 'success');


  UI.closeModal();
  renderTeachersPage(document.querySelector('.page-content'));
};

window.openEditTeacherModal = function(id) {
  const t = DB.getTeacher(id);
  UI.openModal(`Edit — ${t.name}`, `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input type="text" class="form-input-plain" id="et-name" value="${t.name}" />
      </div>
      <div class="form-group">
        <label class="form-label">Session Rate (EGP)</label>
        <input type="number" class="form-input-plain" id="et-rate" value="${t.sessionRate}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="grid-column: span 2">
        <label class="form-label">Email</label>
        <input type="email" class="form-input-plain" id="et-email" value="${t.email || ''}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">WhatsApp Number / رقم الواتساب</label>
      <input type="tel" class="form-input-plain" id="et-whatsapp" value="${t.whatsappNumber || ''}" placeholder="e.g. +201012345678" />
      <div style="font-size:10px;color:var(--text-muted);margin-top:4px">For admin contact only — not shared with students</div>
    </div>
    <div class="form-group">
      <label class="form-label">Status</label>
      <select class="form-input-plain" id="et-status">
        <option value="active" ${t.status==='active'?'selected':''}>Active</option>
        <option value="inactive" ${t.status==='inactive'?'selected':''}>Inactive</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Bio</label>
      <textarea class="form-input-plain" id="et-bio">${t.bio||''}</textarea>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditTeacher('${id}')">Save Changes</button>
    </div>
  `);
};

window.saveEditTeacher = async function(id) {
  const name = document.getElementById('et-name').value.trim();
  const email = document.getElementById('et-email').value.trim();
  const sessionRate = parseInt(document.getElementById('et-rate').value);
  const whatsappNumber = document.getElementById('et-whatsapp').value.trim();
  const status = document.getElementById('et-status').value;
  const bio = document.getElementById('et-bio').value.trim();
  await DB.updateTeacher(id, { name, email, sessionRate, whatsappNumber, status, bio });
  
  UI.toast('Teacher updated!', 'success');

  UI.closeModal();
  renderTeachersPage(document.querySelector('.page-content'));
};
window.deleteTeacherConfirm = function(id) {
  const t = DB.getTeacher(id);
  UI.confirm(window.t ? window.t('Remove '+t.name+' from the system? This cannot be undone.') : `Remove ${t.name} from the system? This cannot be undone.`, async () => {
    await DB.deleteTeacher(id);
    UI.toast(`${t.name} removed.`, 'info');
    renderTeachersPage(document.querySelector('.page-content'));
  });
};
