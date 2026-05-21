/* ================================================
   ADMIN STUDENTS PAGE
   ================================================ */
Router.register('admin-students', function(container) {
  renderStudentsPage(container, '');
});

function renderStudentsPage(container, searchQuery) {
  const students = DB.getStudents({ search: searchQuery });
  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">${window.t?window.t('Students'):'Students'}</h2>
        <p class="section-subtitle">${students.length} ${window.t?window.t('enrolled students across all families'):'enrolled students across all families'}</p>
      </div>
      <button class="btn btn-primary" onclick="openAddStudentModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        ${window.t?window.t('Add Student'):'Add Student'}
      </button>
    </div>

    <!-- Summary Stats -->
    <div class="stats-grid" style="margin-bottom:var(--space-6)">
      <div class="stat-card teal" style="padding:var(--space-4) var(--space-5)">
        <div class="stat-label">${window.t?window.t('Active'):'Active'}</div>
        <div class="stat-value" style="font-size:var(--text-2xl)">${DB.getStudents({status:'active'}).length}</div>
      </div>
      <div class="stat-card gold" style="padding:var(--space-4) var(--space-5)">
        <div class="stat-label">${window.t?window.t('Quran Students'):'Quran Students'}</div>
        <div class="stat-value" style="font-size:var(--text-2xl)">${DB.getStudents().filter(s=>s.courses.includes('Quran')).length}</div>
      </div>
      <div class="stat-card blue" style="padding:var(--space-4) var(--space-5)">
        <div class="stat-label">${window.t?window.t('Arabic Students'):'Arabic Students'}</div>
        <div class="stat-value" style="font-size:var(--text-2xl)">${DB.getStudents().filter(s=>s.courses.includes('Arabic')).length}</div>
      </div>
      <div class="stat-card purple" style="padding:var(--space-4) var(--space-5)">
        <div class="stat-label">${window.t?window.t('Fiqh Students'):'Fiqh Students'}</div>
        <div class="stat-value" style="font-size:var(--text-2xl)">${DB.getStudents().filter(s=>s.courses.includes('Fiqh')).length}</div>
      </div>
    </div>

    <div class="content-card">
      <div class="card-body">
        <div class="filter-bar">
          <div class="search-input-wrap">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" class="search-input" placeholder="${window.t?window.t('Search by name or code...'):'Search by name or code...'}" id="student-search"
              oninput="filterStudents(this.value)" value="${searchQuery}" />
          </div>
          <select class="form-input-plain" style="height:40px;width:auto" id="student-filter-status" onchange="filterStudentsByStatus(this.value)">
            <option value="">${window.t?window.t('All Status'):'All Status'}</option>
            <option value="active">${window.t?window.t('Active'):'Active'}</option>
            <option value="inactive">${window.t?window.t('Inactive'):'Inactive'}</option>
          </select>
          <select class="form-input-plain" style="height:40px;width:auto" id="student-filter-course" onchange="filterStudentsByCourse(this.value)">
            <option value="">${window.t?window.t('All Courses'):'All Courses'}</option>
            <option value="Quran">${window.t?window.t('Quran'):'Quran'}</option>
            <option value="Arabic">${window.t?window.t('Arabic'):'Arabic'}</option>
            <option value="Fiqh">${window.t?window.t('Fiqh'):'Fiqh'}</option>
          </select>
        </div>
      </div>
      <div class="card-body-flush">
        <div class="table-wrapper">
          <table class="data-table" id="students-table">
            <thead><tr>
              <th>${window.t?window.t('Student'):'Student'}</th><th>${window.t?window.t('Code'):'Code'}</th><th>${window.t?window.t('Family'):'Family'}</th><th>${window.t?window.t('Age'):'Age'}</th><th>${window.t?window.t('Courses'):'Courses'}</th><th>${window.t?window.t('Status'):'Status'}</th><th>${window.t?window.t('Joined'):'Joined'}</th><th>${window.t?window.t('Actions'):'Actions'}</th>
            </tr></thead>
            <tbody>
              ${renderStudentRows(students)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderStudentRows(students) {
  if (!students.length) return `<tr><td colspan="8"><div class="empty-state" style="padding:var(--space-10)"><div class="empty-state-icon">🔍</div><p class="empty-state-title">${window.t?window.t('No students found'):'No students found'}</p></div></td></tr>`;
  return students.map(s => {
    const family = DB.getFamily(s.familyId);
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:var(--space-3)">
        ${UI.avatar(s.name, 'avatar avatar-sm')}
        <div><div style="font-weight:600">${s.name}</div></div>
      </div></td>
      <td><code style="font-size:11px;color:var(--gold-300);background:rgba(201,168,76,0.08);padding:2px 6px;border-radius:4px">${s.id}</code></td>
      <td style="color:var(--text-secondary);font-size:var(--text-sm)">${family ? family.name : '—'}</td>
      <td style="color:var(--text-secondary);font-size:var(--text-sm)">${s.age} ${window.t?window.t('yrs'):'yrs'}</td>
      <td>${s.courses.map(c => `<span class="badge badge-${UI.fmt.courseColor(c)}" style="margin:1px">${window.t?window.t(c):c}</span>`).join('')}</td>
      <td>${UI.badge(s.status === 'active' ? (window.t?window.t('Active'):'Active') : (window.t?window.t('Inactive'):'Inactive'), s.status === 'active' ? 'success' : 'danger')}</td>
      <td style="color:var(--text-muted);font-size:var(--text-sm)">${UI.fmt.date(s.joinDate)}</td>
      <td>
        <div style="display:flex;gap:var(--space-1)">
          <button class="btn btn-ghost btn-sm btn-icon" title="${window.t?window.t('View Details'):'View Details'}" onclick="viewStudentProfile('${s.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm btn-icon" title="${window.t?window.t('Edit'):'Edit'}" onclick="openEditStudentModal('${s.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm btn-icon" title="${window.t?window.t('Remove'):'Remove'}" style="color:var(--danger)" onclick="deleteStudentConfirm('${s.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

window._studentFilterStatus = '';
window._studentFilterCourse = '';
window._studentSearch = '';

window.filterStudents = function(q) {
  window._studentSearch = q;
  updateStudentTable();
};
window.filterStudentsByStatus = function(v) {
  window._studentFilterStatus = v;
  updateStudentTable();
};
window.filterStudentsByCourse = function(v) {
  window._studentFilterCourse = v;
  updateStudentTable();
};

function updateStudentTable() {
  let students = DB.getStudents({ search: window._studentSearch, status: window._studentFilterStatus });
  if (window._studentFilterCourse) students = students.filter(s => s.courses.includes(window._studentFilterCourse));
  const tbody = document.querySelector('#students-table tbody');
  if (tbody) tbody.innerHTML = renderStudentRows(students);
}

window.openAddStudentModal = function() {
  const families = DB.getFamilies();
  UI.openModal('Add New Student', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Full Name <span class="form-required">*</span></label>
        <input type="text" class="form-input-plain" id="s-name" placeholder="e.g., Omar Hassan" />
      </div>
      <div class="form-group">
        <label class="form-label">Age</label>
        <input type="number" class="form-input-plain" id="s-age" placeholder="12" min="4" max="30" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" class="form-input-plain" id="s-email" placeholder="Student Email (for login)" />
      </div>
      <div class="form-group" style="display:none">
        <label class="form-label">Password</label>
        <input type="password" class="form-input-plain" id="s-password" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="display:none">
        <label class="form-label">Grade / Level</label>
        <input type="text" class="form-input-plain" id="s-grade" />
      </div>
      <div class="form-group">
        <label class="form-label">Family <span class="form-required">*</span></label>
        <select class="form-input-plain" id="s-family" onchange="toggleNewFamilyFields(this.value)">
          <option value="">Select family...</option>
          ${families.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
          <option value="NEW_FAMILY" style="font-weight:bold;color:var(--primary)">+ Create New Family</option>
        </select>
      </div>
    </div>
    
    <div id="new-family-fields" style="display:none; padding: 15px; background: rgba(0,0,0,0.02); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 15px;">
      <div style="font-weight:600; margin-bottom:10px; font-size:14px; color:var(--text-secondary)">New Family Details</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Family Name <span class="form-required">*</span></label>
          <input type="text" class="form-input-plain" id="nf-name" placeholder="e.g. Al-Farsi Family" />
        </div>
        <div class="form-group">
          <label class="form-label">Parent Name</label>
          <input type="text" class="form-input-plain" id="nf-parent" placeholder="Parent Name" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Contact Phone <span class="form-required">*</span></label>
          <input type="tel" class="form-input-plain" id="nf-phone" placeholder="Phone" />
        </div>
        <div class="form-group">
          <label class="form-label">Email <span class="form-required">*</span></label>
          <input type="email" class="form-input-plain" id="nf-email" placeholder="email@example.com" />
        </div>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Courses</label>
      <div style="display:flex;gap:var(--space-3)">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:var(--text-sm)"><input type="checkbox" id="c-quran" value="Quran"> Quran</label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:var(--text-sm)"><input type="checkbox" id="c-arabic" value="Arabic"> Arabic</label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:var(--text-sm)"><input type="checkbox" id="c-fiqh" value="Fiqh"> Fiqh</label>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Agreed Rate per Session (USD)</label>
      <input type="number" class="form-input-plain" id="s-rate" placeholder="6" min="0" />
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewStudent()">Add Student</button>
    </div>
  `);
};

window.toggleNewFamilyFields = function(val) {
  const el = document.getElementById('new-family-fields');
  if (el) {
    el.style.display = val === 'NEW_FAMILY' ? 'block' : 'none';
  }
};

window.saveNewStudent = async function() {
  const name    = document.getElementById('s-name').value.trim();
  const age     = parseInt(document.getElementById('s-age').value) || 0;
  const grade   = document.getElementById('s-grade').value.trim();
  let familyId  = document.getElementById('s-family').value;
  const courses = ['c-quran','c-arabic','c-fiqh']
    .filter(id => document.getElementById(id)?.checked)
    .map(id => document.getElementById(id).value);
  const sessionRate = parseInt(document.getElementById('s-rate').value) || 6;
  const email       = document.getElementById('s-email') ? document.getElementById('s-email').value.trim() : '';
  const password    = ''; // Auto-linking by email now!

  if (!name || !familyId) { UI.toast('Please fill in required fields.', 'error'); return; }

  if (familyId === 'NEW_FAMILY') {
    const fn = document.getElementById('nf-name').value.trim();
    const fp = document.getElementById('nf-parent').value.trim();
    const fphone = document.getElementById('nf-phone').value.trim();
    const femail = document.getElementById('nf-email').value.trim();
    
    if (!fn || !fphone || !femail) {
      UI.toast('Please fill all required new family details.', 'error');
      return;
    }
    
    const newFam = await DB.addFamily({
      name: fn,
      email: femail,
      phone: fphone,
      parentName: fp,
      plan: 'basic',
      status: 'active',
      monthlyFee: 0
    });
    familyId = newFam.id;
  }

  const stuObj = await DB.addStudent({ name, age, grade, familyId, courses, sessionRate, email });
  
  if (email && password && password.length >= 6) {
     const authRes = await Auth.createManagerUserAccount({
         email, password, name, role: 'student', refId: stuObj.id
     });
     if (!authRes.ok) {
         UI.toast('Student added, but account creation failed: ' + authRes.error, 'warning');
     } else {
         UI.toast(`${name} added and account created!`, 'success');
     }
  } else {
     UI.toast(`${name} added successfully!`, 'success');
  }

  UI.closeModal();
  window._studentSearch = '';
  updateStudentTable();
};

window.viewStudentProfile = function(id) {
  const s = DB.getStudent(id);
  const family = DB.getFamily(s.familyId);
  const attendance = DB.getAttendance({ studentId: id });
  const sessions = DB.getSessions({ studentId: id });
  const present  = attendance.filter(a => a.status === 'present').length;
  const absent   = attendance.filter(a => a.status === 'absent').length;
  const late     = attendance.filter(a => a.status === 'late').length;
  const attRate  = attendance.length ? Math.round((present / attendance.length) * 100) : 0;

  UI.openModal(`${s.name} — ${window.t?window.t('Profile'):'Profile'}`, `
    <div style="display:flex;align-items:center;gap:var(--space-4);margin-bottom:var(--space-5);padding-bottom:var(--space-5);border-bottom:1px solid var(--border)">
      ${UI.avatar(s.name, 'avatar avatar-lg')}
      <div>
        <div style="font-size:var(--text-xl);font-weight:800">${s.name}</div>
        <div style="color:var(--gold-300);font-size:var(--text-sm);font-weight:600">${s.id}</div>
        <div style="margin-top:4px">${s.courses.map(c => `<span class="badge badge-${UI.fmt.courseColor(c)}">${window.t?window.t(c):c}</span>`).join(' ')}</div>
      </div>
    </div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Family'):'Family'}</span><span class="info-row-value">${family ? family.name : '—'}</span></div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Age'):'Age'}</span><span class="info-row-value">${s.age} ${window.t?window.t('years'):'years'}</span></div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Status'):'Status'}</span><span class="info-row-value">${UI.badge(window.t?window.t(s.status==='active'?'Active':'Inactive'):s.status,'success')}</span></div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Joined'):'Joined'}</span><span class="info-row-value">${UI.fmt.date(s.joinDate)}</span></div>
    <div class="info-row"><span class="info-row-label">${window.t?window.t('Total Sessions'):'Total Sessions'}</span><span class="info-row-value">${sessions.length}</span></div>
    <div style="margin-top:var(--space-5)">
      <div style="font-weight:700;margin-bottom:var(--space-3)">${window.t?window.t('Attendance Summary'):'Attendance Summary'}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:var(--space-3);text-align:center">
        <div class="att-summary-card"><div class="att-summary-value text-success">${present}</div><div class="att-summary-label">${window.t?window.t('Present'):'Present'}</div></div>
        <div class="att-summary-card"><div class="att-summary-value text-danger">${absent}</div><div class="att-summary-label">${window.t?window.t('Absent'):'Absent'}</div></div>
        <div class="att-summary-card"><div class="att-summary-value text-warning">${late}</div><div class="att-summary-label">${window.t?window.t('Late'):'Late'}</div></div>
        <div class="att-summary-card"><div class="att-summary-value text-accent">${attRate}%</div><div class="att-summary-label">${window.t?window.t('Rate'):'Rate'}</div></div>
      </div>
    </div>
  `, false);
};

window.openEditStudentModal = function(id) {
  const s = DB.getStudent(id);
  const families = DB.getFamilies();
  UI.openModal(`Edit — ${s.name}`, `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input type="text" class="form-input-plain" id="es-name" value="${s.name}" />
      </div>
      <div class="form-group">
        <label class="form-label">Age</label>
        <input type="number" class="form-input-plain" id="es-age" value="${s.age}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" class="form-input-plain" id="es-email" value="${s.email || ''}" placeholder="Student Email" />
      </div>
      <div class="form-group" style="display:none">
        <label class="form-label">Set Password</label>
        <input type="password" class="form-input-plain" id="es-password" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="display:none">
        <label class="form-label">Grade</label>
        <input type="text" class="form-input-plain" id="es-grade" value="${s.grade||''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-input-plain" id="es-status">
          <option value="active" ${s.status==='active'?'selected':''}>Active</option>
          <option value="inactive" ${s.status==='inactive'?'selected':''}>Inactive</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Courses</label>
      <div style="display:flex;gap:var(--space-3)">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:var(--text-sm)"><input type="checkbox" id="ec-quran" value="Quran" ${s.courses.includes('Quran')?'checked':''}> Quran</label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:var(--text-sm)"><input type="checkbox" id="ec-arabic" value="Arabic" ${s.courses.includes('Arabic')?'checked':''}> Arabic</label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:var(--text-sm)"><input type="checkbox" id="ec-fiqh" value="Fiqh" ${s.courses.includes('Fiqh')?'checked':''}> Fiqh</label>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Agreed Rate per Session (USD)</label>
      <input type="number" class="form-input-plain" id="es-rate" value="${s.sessionRate || 6}" min="0" />
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditStudent('${id}')">Save Changes</button>
    </div>
  `);
};

window.saveEditStudent = async function(id) {
  const name   = document.getElementById('es-name').value.trim();
  const age    = parseInt(document.getElementById('es-age').value);
  const grade  = document.getElementById('es-grade').value.trim();
  const status = document.getElementById('es-status').value;
  const courses= ['ec-quran','ec-arabic','ec-fiqh'].filter(i => document.getElementById(i)?.checked).map(i => document.getElementById(i).value);
  const sessionRate = parseInt(document.getElementById('es-rate').value) || 6;
  const email       = document.getElementById('es-email') ? document.getElementById('es-email').value.trim() : '';
  const password    = ''; // Auto-linking

  await DB.updateStudent(id, { name, age, grade, status, courses, sessionRate, email });
  
  if (email && password && password.length >= 6) {
     const authRes = await Auth.createManagerUserAccount({
         email, password, name, role: 'student', refId: id
     });
     if (!authRes.ok) {
         UI.toast('Student updated, but account creation failed: ' + authRes.error, 'warning');
     } else {
         UI.toast(`Student updated and account created!`, 'success');
     }
  } else {
     UI.toast('Student updated successfully!', 'success');
  }

  UI.closeModal();
  updateStudentTable();
};

window.deleteStudentConfirm = function(id) {
  const s = DB.getStudent(id);
  UI.confirm(`Remove ${s.name} from the system? This cannot be undone.`, () => {
    DB.deleteStudent(id);
    UI.toast(`${s.name} removed.`, 'info');
    updateStudentTable();
  });
};
