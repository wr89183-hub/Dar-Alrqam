/* ================================================
   ADMIN FAMILIES PAGE — Full CRUD & Profile
   ================================================ */
'use strict';

let currentFamilyId = null;

Router.register('admin-families', function(container) {
  if (currentFamilyId) {
    renderFamilyProfile(container, currentFamilyId);
  } else {
    renderFamiliesList(container);
  }
});

function renderFamiliesList(container) {
  const families = DB.getFamilies();
  
  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">${window.t?window.t('Families & Accounts'):'Families & Accounts'}</h2>
        <p class="section-subtitle">${window.t?window.t('Manage family accounts and billing plans'):'Manage family accounts and billing plans'}</p>
      </div>
      <div>
        <button class="btn btn-primary" onclick="openAFamilyModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>${window.t?window.t('New Family'):'New Family'}</span>
        </button>
      </div>
    </div>

    <div class="content-card">
      <div class="card-body-flush">
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr>
              <th>${window.t?window.t('Family'):'Family'}</th><th>${window.t?window.t('ID'):'ID'}</th><th>${window.t?window.t('Contact'):'Contact'}</th><th>${window.t?window.t('Students'):'Students'}</th><th>${window.t?window.t('Expected Children'):'Expected Children'}</th><th>${window.t?window.t('Base Rate / Session'):'Base Rate / Session'}</th><th>${window.t?window.t('Status'):'Status'}</th><th>${window.t?window.t('Actions'):'Actions'}</th>
            </tr></thead>
            <tbody>
              ${families.map(f => {
                const studs = DB.getStudents({ familyId: f.id });
                const aggregatedRate = studs.reduce((sum, s) => sum + (s.sessionRate || 0), 0);
                return `<tr style="cursor:pointer" class="hover-row" onclick="viewFamily('${f.id}')">
                  <td><div style="display:flex;align-items:center;gap:var(--space-3)">
                    ${UI.avatar(f.name, 'avatar avatar-sm')}
                    <span style="font-weight:600">${f.name}</span>
                  </div></td>
                  <td><code style="font-size:11px;color:var(--gold-300)">${f.id}</code></td>
                  <td style="font-size:var(--text-sm)">
                    <div>${f.email}</div>
                    <div style="color:var(--text-muted)">${f.phone}</div>
                  </td>
                  <td>
                    <div style="margin-bottom: 4px;"><span class="badge badge-blue">${studs.length} ${window.t?window.t('student(s)'):'student(s)'}</span></div>
                    <div style="font-size: var(--text-xs); color: var(--text-secondary); line-height: 1.4;">
                      ${studs.map(s => `• ${s.name} <span style="opacity:0.7">(${s.courses.map(c=>window.t?window.t(c):c).join(', ')})</span>`).join('<br>')}
                    </div>
                  </td>
                  <td><span class="badge badge-gray">${f.plan || '0'} Child(ren)</span></td>
                  <td style="color:var(--success);font-weight:700">$${aggregatedRate}/Session</td>
                  <td>${UI.badge(f.status === 'active' ? (window.t?window.t('Active'):'Active') : (window.t?window.t('Inactive'):'Inactive'), f.status === 'active' ? 'success' : 'danger')}</td>
                  <td>
                    <div style="display:flex;gap:8px" onclick="event.stopPropagation()">
                      <button class="btn btn-ghost btn-sm btn-icon" onclick="openAFamilyModal('${f.id}')">✏️</button>
                      <button class="btn btn-ghost btn-sm btn-icon" style="color:var(--danger)" onclick="deleteFamily('${f.id}')">🗑️</button>
                    </div>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// Global functions
window.viewFamily = function(id) {
  currentFamilyId = id;
  Router.navigate('admin-families');
};

window.backToFamilies = function() {
  currentFamilyId = null;
  Router.navigate('admin-families');
};

/* ── PROFILE VIEW ── */
function renderFamilyProfile(container, id) {
  const family = DB.getFamily(id);
  if (!family) return backToFamilies();
  const students = DB.getStudents({ familyId: id });

  container.innerHTML = `
    <div style="margin-bottom:var(--space-4)">
      <button class="btn btn-ghost btn-sm" onclick="backToFamilies()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        ${window.t?window.t('Back to All Families'):'Back to All Families'}
      </button>
    </div>

    <div class="dash-grid-2" style="grid-template-columns: 1fr 2fr;">
      
      <!-- Profile Card -->
      <div class="content-card">
        <div class="card-body" style="text-align:center;border-bottom:1px solid var(--border)">
          ${UI.avatar(family.name, 'avatar avatar-lg')}
          <h2 style="margin-top:var(--space-3);font-size:var(--text-xl)">${family.name}</h2>
          <div style="color:var(--text-muted);font-size:var(--text-sm)">${family.id}</div>
          <div style="margin-top:var(--space-3)">
            ${UI.badge(family.status === 'active' ? (window.t?window.t('Active'):'Active Account') : (window.t?window.t('Inactive'):'Inactive'), family.status === 'active' ? 'success' : 'danger')}
          </div>
        </div>
        <div class="card-body">
          <div class="info-row"><span class="info-row-label">${window.t?window.t('Parent Email'):'Parent Email'}</span><span class="info-row-value">${family.email}</span></div>
          <div class="info-row"><span class="info-row-label">${window.t?window.t('Phone'):'Phone'}</span><span class="info-row-value">${family.phone}</span></div>
          <div class="info-row"><span class="info-row-label">${window.t?window.t('Expected Children'):'Expected Children'}</span><span class="info-row-value">${family.plan || '0'}</span></div>
          <div class="info-row"><span class="info-row-label">${window.t?window.t('Billing Type'):'Billing Type'}</span><span class="info-row-value" style="color:var(--success);font-weight:700">Per Student Activity</span></div>
          <div class="info-row"><span class="info-row-label">${window.t?window.t('Join Date'):'Join Date'}</span><span class="info-row-value">${UI.fmt.date(family.joinDate)}</span></div>
          <div style="margin-top:var(--space-5);display:flex;gap:var(--space-2)">
            <button class="btn btn-secondary btn-full" onclick="openAFamilyModal('${family.id}')">${window.t?window.t('Edit Family Details'):'Edit Family Details'}</button>
          </div>
        </div>
      </div>

      <!-- Children Details -->
      <div class="content-card">
        <div class="card-header">
          <span class="card-title">${window.t?window.t('Children / Students'):'Children / Students'}</span>
          <button class="btn btn-primary btn-sm" onclick="openFamilyChildModal('${family.id}')">+ ${window.t?window.t('Add Child'):'Add Child'}</button>
        </div>
        <div class="card-body-flush">
          <div class="table-wrapper">
            <table class="data-table">
              <thead><tr><th>${window.t?window.t('Full Name'):'Full Name'}</th><th>${window.t?window.t('Code'):'Code'}</th><th>${window.t?window.t('Courses'):'Courses'}</th><th>${window.t?window.t('Status'):'Status'}</th><th>${window.t?window.t('Actions'):'Actions'}</th></tr></thead>
              <tbody>
                ${students.length === 0 ? `<tr><td colspan="5"><div class="empty-state"><p>${window.t?window.t('No children enrolled yet.'):'No children enrolled yet.'}</p></div></td></tr>` : 
                students.map(s => `<tr>
                  <td><div style="display:flex;align-items:center;gap:var(--space-2)">
                    ${UI.avatar(s.name, 'avatar avatar-sm')} <span style="font-weight:600">${s.name}</span>
                  </div></td>
                  <td><code style="color:var(--gold-300);font-size:11px">${s.id}</code></td>
                  <td>${s.courses.map(c => `<span class="badge badge-${UI.fmt.courseColor(c)}">${window.t?window.t(c):c}</span>`).join(' ')}</td>
                  <td>${UI.badge(s.status === 'active' ? (window.t?window.t('Active'):'Active') : (window.t?window.t('Inactive'):'Inactive'), s.status === 'active' ? 'success' : 'danger')}</td>
                  <td>
                    <button class="btn btn-ghost btn-sm btn-icon" onclick="openFamilyChildModal('${family.id}', '${s.id}')">✏️</button>
                    <button class="btn btn-ghost btn-sm btn-icon" style="color:var(--danger)" onclick="deleteChild('${s.id}')">✕</button>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ── MODALS ── */
window.openAFamilyModal = function(id = null) {
  const f = id ? DB.getFamily(id) : null;
  UI.openModal(f ? 'Edit Family' : 'New Family', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Family Name <span class="form-required">*</span></label>
        <input type="text" id="mf-name" class="form-input-plain" value="${f ? f.name : ''}" placeholder="e.g. Al-Farsi Family" />
      </div>
      <div class="form-group">
        <label class="form-label">Main Parent Email <span class="form-required">*</span></label>
        <input type="email" id="mf-email" class="form-input-plain" value="${f ? f.email : ''}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Contact Phone <span class="form-required">*</span></label>
        <input type="tel" id="mf-phone" class="form-input-plain" value="${f ? f.phone : ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select id="mf-status" class="form-input-plain">
          <option value="active" ${f && f.status === 'active' ? 'selected' : ''}>Active</option>
          <option value="inactive" ${f && f.status === 'inactive' ? 'selected' : ''}>Inactive</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Expected Children Count / عدد الأطفال</label>
        <select id="mf-plan" class="form-input-plain">
          <option value="1" ${f && f.plan === '1' ? 'selected' : ''}>1</option>
          <option value="2" ${f && f.plan === '2' ? 'selected' : ''}>2</option>
          <option value="3" ${f && f.plan === '3' ? 'selected' : ''}>3</option>
          <option value="4" ${f && f.plan === '4' ? 'selected' : ''}>4</option>
          <option value="5" ${f && f.plan === '5' ? 'selected' : ''}>5</option>
        </select>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveFamily('${id || ''}')">${id ? 'Save Changes' : 'Create Family'}</button>
    </div>
  `);
};

window.saveFamily = async function(id) {
  const name = document.getElementById('mf-name').value;
  const email = document.getElementById('mf-email').value;
  const phone = document.getElementById('mf-phone').value;
  const plan = document.getElementById('mf-plan').value;
  const status = document.getElementById('mf-status').value;
  const monthlyFee = 0;

  if (!name || !email || !phone) {
    return UI.toast('Please fill all required fields.', 'error');
  }

  const data = { name, email, phone, plan, status, monthlyFee };
  if (id) {
    await DB.updateFamily(id, data);
    UI.toast('Family updated', 'success');
  } else {
    await DB.addFamily(data);
    UI.toast('Family created successfully', 'success');
  }
  UI.closeModal();
  Router.navigate('admin-families');
};

window.deleteFamily = function(id) {
  UI.confirm('Are you sure you want to delete this family? This removes parent access.', async () => {
    await DB.deleteFamily(id);
    UI.toast('Family deleted', 'info');
    Router.navigate('admin-families');
  });
};

window.openFamilyChildModal = function(familyId, studentId = null) {
  const stu = studentId ? DB.getStudent(studentId) : null;
  UI.openModal(stu ? 'Edit Child' : 'Add Child', `
    <div class="form-group">
      <label class="form-label">Child Full Name <span class="form-required">*</span></label>
      <input type="text" id="mfc-name" class="form-input-plain" value="${stu ? stu.name : ''}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Age</label>
        <input type="number" id="mfc-age" class="form-input-plain" value="${stu ? stu.age : ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Grade</label>
        <input type="text" id="mfc-grade" class="form-input-plain" value="${stu ? stu.grade : ''}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Courses Included <span class="form-required">*</span></label>
      <select id="mfc-courses" class="form-input-plain" multiple style="height:80px">
        <option value="Quran" ${stu && stu.courses.includes('Quran') ? 'selected' : ''}>Quran</option>
        <option value="Arabic" ${stu && stu.courses.includes('Arabic') ? 'selected' : ''}>Arabic</option>
        <option value="Fiqh" ${stu && stu.courses.includes('Fiqh') ? 'selected' : ''}>Islamic Fiqh</option>
      </select>
      <span style="font-size:10px;color:var(--text-muted)">Hold Ctrl/Cmd to select multiple</span>
    </div>
    <div class="form-group">
      <label class="form-label">Status</label>
      <select id="mfc-status" class="form-input-plain">
        <option value="active" ${stu && stu.status === 'active' ? 'selected' : ''}>Active</option>
        <option value="inactive" ${stu && stu.status === 'inactive' ? 'selected' : ''}>Inactive</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Agreed Rate per Session (USD)</label>
      <input type="number" class="form-input-plain" id="mfc-rate" value="${stu && stu.sessionRate !== undefined ? stu.sessionRate : 6}" min="0" />
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveFamilyChild('${familyId}', '${studentId || ''}')">Save</button>
    </div>
  `);
};

window.saveFamilyChild = async function(familyId, studentId) {
  const name = document.getElementById('mfc-name').value;
  const age = parseInt(document.getElementById('mfc-age').value) || 0;
  const grade = document.getElementById('mfc-grade').value;
  const status = document.getElementById('mfc-status').value;
  const sessionRate = parseInt(document.getElementById('mfc-rate').value) || 6;
  const courses = Array.from(document.getElementById('mfc-courses').selectedOptions).map(o => o.value);

  if (!name || !courses.length) {
    return UI.toast('Please provide name and at least one course.', 'error');
  }

  if (studentId) {
    await DB.updateStudent(studentId, { name, age, grade, status, courses, sessionRate });
    UI.toast('Student updated', 'success');
  } else {
    await DB.addStudent({ name, familyId, age, grade, status, courses, sessionRate });
    UI.toast('Student added to family', 'success');
  }
  UI.closeModal();
  Router.navigate('admin-families');
};

window.deleteChild = function(id) {
  UI.confirm('Are you sure you want to remove this student? All related attendance records will remain but the profile will be deleted.', async () => {
    await DB.deleteStudent(id);
    UI.toast('Student removed', 'info');
    Router.navigate('admin-families');
  });
};
