/* ================================================
   STUDENT CALENDAR (SCHEDULE) PAGE
   ================================================ */
Router.register('student-schedule', function(container) {
  const myStudentId  = Auth.getRefId();
  const me = DB.getStudent(myStudentId);
  const siblings = (me && me.familyId) ? DB.getStudents({ familyId: me.familyId }) : [];
  if (siblings.length === 0 && me) siblings.push(me);

  const allSessions = [];
  siblings.forEach(student => {
     if(student) {
       DB.getSessions({ studentId: student.id }).forEach(s => {
         if (!allSessions.find(x => x.id === s.id)) allSessions.push({...s, _forStudent: student.name.split(' ')[0]});
       });
     }
  });

  // Calculate calendar month grid (current month)
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay(); // 0 is Sunday

  let blanks = '';
  for(let i=0; i<startingDay; i++){ blanks += `<div class="cal-day empty"></div>`; }

  let daysHTML = '';
  for(let d=1; d<=daysInMonth; d++){
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const daySessions = allSessions.filter(s => s.date === dateStr);
      
      let sessTags = '';
      daySessions.forEach(s => {
         const teacher = DB.getTeacher(s.teacherId);
         const fname = teacher ? teacher.name.replace(/(Ustadh|Ustadha)\s+/i, '').split(' ')[0] : 'Instructor';
         sessTags += `
           <div class="cal-event" style="background:var(--${UI.fmt.courseColor(s.courseType)}-trans); border-left: 2px solid var(--${UI.fmt.courseColor(s.courseType)}); padding: 4px; margin-bottom: 4px; border-radius: 2px; font-size: 10px;">
             <strong>${UI.fmt.time(s.time)}</strong>: ${s.courseType} (${s._forStudent})<br>
             <span style="color:var(--text-muted)">🧑‍🏫 ${fname} • ${s.duration}m</span>
           </div>
         `;
      });

      const isToday = dateStr === now.toISOString().split('T')[0];
      daysHTML += `<div class="cal-day" style="min-height: 100px; padding: 4px; border: 1px solid var(--border); ${isToday ? 'background:rgba(201,168,76,0.1)' : ''}">
         <div style="font-weight:bold; margin-bottom: 4px; ${isToday ? 'color:var(--gold-400)' : ''}">${d}</div>
         ${sessTags}
      </div>`;
  }

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title">Monthly Family Schedule</h2>
        <p class="section-subtitle">${now.toLocaleString('default', { month: 'long' })} ${year}</p>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="Router.navigate('student-dashboard')">Back</button>
    </div>

    <div class="content-card">
      <div class="card-body-flush" style="padding: 16px">
         <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align:center; font-weight:bold; margin-bottom: 8px; font-size: 12px; color:var(--text-muted)">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
         </div>
         <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">
            ${blanks}
            ${daysHTML}
         </div>
      </div>
    </div>
  `;
});
