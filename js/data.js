/* ================================================
   DATA.JS — Real-time Database (Supabase-backed)
   ================================================ */
'use strict';

class AcademyDB {
  constructor() {
    this._data = {
      users: [],
      families: [],
      students: [],
      teachers: [],
      sessions: [],
      attendance: [],
      payments: [],
      notifications: [],
      evaluations: [],
      studentSchedules: [],
      scheduleChangeLogs: [],
    };
    this.isLoaded = false;
  }

  // Called after login or on app start to sync data
  async loadState() {
    if (!window.supabaseClient) return;
    
    const [profRes, famRes, stuRes, tchrRes, sessRes, attRes, payRes, notifRes, evalRes, schedRes, logRes] = await Promise.all([
      supabaseClient.from('user_profiles').select('*'),
      supabaseClient.from('families').select('*'),
      supabaseClient.from('students').select('*'),
      supabaseClient.from('teachers').select('*'),
      supabaseClient.from('sessions').select('*'),
      supabaseClient.from('attendance').select('*'),
      supabaseClient.from('payments').select('*'),
      supabaseClient.from('notifications').select('*'),
      supabaseClient.from('evaluations').select('*'),
      supabaseClient.from('student_schedules').select('*'),
      supabaseClient.from('schedule_change_log').select('*'),
    ]);

    this._data.users = profRes.data || [];
    this._data.families = famRes.data || [];
    this._data.students = stuRes.data || [];
    this._data.teachers = tchrRes.data || [];
    
    // Sessions normally have studentIds linked via session_students
    // We'll map them manually for compatibility with the frontend structure
    const sessionStudentsRes = await supabaseClient.from('session_students').select('*');
    const sessStudentsList = sessionStudentsRes.data || [];
    
    this._data.sessions = (sessRes.data || []).map(s => {
      s.studentIds = sessStudentsList.filter(ss => ss.session_id === s.id).map(ss => ss.student_id);
      return s;
    });

    this._data.attendance = attRes.data || [];
    this._data.payments = payRes.data || [];
    this._data.notifications = notifRes.data || [];
    this._data.evaluations = evalRes.data || [];
    this._data.studentSchedules = schedRes.data || [];
    this._data.scheduleChangeLogs = logRes.data || [];
    
    this.isLoaded = true;
  }

  // ── Users ──
  getUserByEmail(email) { return this._data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null; }
  getUserById(id) { return this._data.users.find(u => u.id === id) || null; }

  // ── Students ──
  getStudents(filter = {}) {
    let list = [...this._data.students];
    if (filter.status) list = list.filter(s => s.status === filter.status);
    if (filter.familyId) list = list.filter(s => (s.family_id === filter.familyId) || (s.familyId === filter.familyId));
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
    }
    return list.map(s => ({...s, familyId: s.family_id || s.familyId, sessionRate: s.session_rate || s.sessionRate, courses: s.courses || []}));
  }
  getStudent(id) { 
    const s = this._data.students.find(s => s.id === id); 
    return s ? {...s, familyId: s.family_id || s.familyId, sessionRate: s.session_rate || s.sessionRate, courses: s.courses || []} : null; 
  }
  
  async addStudent(data) {
    const existing = this._data.students;
    let maxId = 0;
    existing.forEach(s => {
      if (s.id && typeof s.id === 'string' && s.id.includes('-')) {
        const num = parseInt(s.id.split('-')[1]);
        if (!isNaN(num) && num > maxId) maxId = num;
      }
    });
    const newId = `STU-${String(maxId + 1).padStart(4,'0')}`;
    const student = { avatar: data.name.charAt(0).toUpperCase(), join_date: new Date().toISOString().split('T')[0], status: 'active', courses: [], session_rate: data.sessionRate || 6, ...data, id: newId };
    
    // Convert to DB format rules (snake_case)
    const dbPayload = { ...student, family_id: student.familyId };
    delete dbPayload.familyId;
    delete dbPayload.joinDate;
    delete dbPayload.sessionRate;
    delete dbPayload.session_rate;
    if (dbPayload.email !== undefined) delete dbPayload.email;
    
    const { error } = await supabaseClient.from('students').insert([dbPayload]);
    if (error) console.error("Error adding student:", error);
    
    await this.loadState();
    return this.getStudent(newId);
  }
  
  async updateStudent(id, data) {
    const previousStudent = this.getStudent(id);
    const dbPayload = { ...data };
    if (dbPayload.familyId) { dbPayload.family_id = dbPayload.familyId; delete dbPayload.familyId; }
    if (dbPayload.sessionRate !== undefined) delete dbPayload.sessionRate;
    if (dbPayload.session_rate !== undefined) delete dbPayload.session_rate;
    if (dbPayload.email !== undefined) delete dbPayload.email;
    
    const { error } = await supabaseClient.from('students').update(dbPayload).eq('id', id);
    if (error) console.error("Error updating student:", error);
    
    // Handle pause/resume schedule hooks based on status change
    if (data.status && previousStudent && previousStudent.status !== data.status) {
      if (data.status === 'inactive' || data.status === 'paused') {
        // Cancel all future scheduled sessions
        await this.cancelFutureSessionsForStudent(id, 'paused');
        // Pause the schedule record
        const sched = this.getStudentSchedule(id);
        if (sched) {
          await supabaseClient.from('student_schedules').update({ status: 'paused', updated_at: new Date().toISOString() }).eq('id', sched.id);
          await this._logScheduleChange(sched.id, id, 'paused', null);
        }
      } else if (data.status === 'active') {
        // Re-activate the schedule record and regenerate sessions
        const sched = this.getStudentSchedule(id);
        if (sched) {
          await supabaseClient.from('student_schedules').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', sched.id);
          await this.loadState();
          const freshSched = this.getStudentSchedule(id);
          if (freshSched) {
            // Generate from next week's Monday so sessions start fresh
            const startFrom = new Date();
            startFrom.setDate(startFrom.getDate() + 1);
            await this._generateAndInsertSessions(freshSched, startFrom);
            await this._logScheduleChange(freshSched.id, id, 'resumed', null);
          }
        }
      }
    }

    await this.loadState();
    return this.getStudent(id);
  }
  
  async deleteStudent(id) {
    await supabaseClient.from('students').delete().eq('id', id);
    await this.loadState();
  }

  // ── Teachers ──
  getTeachers(filter = {}) {
    let list = [...this._data.teachers];
    if (filter.status) list = list.filter(t => t.status === filter.status);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
    }
    return list.map(t => ({...t, sessionRate: t.session_rate || t.sessionRate, whatsappNumber: t.whatsapp_number || t.whatsappNumber, specialization: t.specialization || []}));
  }
  getTeacher(id) { 
    const t = this._data.teachers.find(t => t.id === id); 
    return t ? {...t, sessionRate: t.session_rate || t.sessionRate, whatsappNumber: t.whatsapp_number || t.whatsappNumber, specialization: t.specialization || []} : null; 
  }
  
  async addTeacher(data) {
    const existing = this._data.teachers;
    const lastNum = existing.length > 0 ? parseInt(existing[existing.length-1].id.split('-')[1]) : 0;
    const newId = `TCH-${String(lastNum + 1).padStart(4,'0')}`;
    
    const teacher = { id: newId, avatar: data.name.charAt(0).toUpperCase(), join_date: new Date().toISOString().split('T')[0], status: 'active', sessions: 0, session_rate: 20, ...data, id: newId };
    
    const dbPayload = { ...teacher, session_rate: teacher.sessionRate, whatsapp_number: teacher.whatsappNumber };
    delete dbPayload.sessionRate;
    delete dbPayload.whatsappNumber;
    delete dbPayload.joinDate;
    
    await supabaseClient.from('teachers').insert([dbPayload]);
    await this.loadState();
    return this.getTeacher(newId);
  }
  
  async updateTeacher(id, data) {
    const dbPayload = { ...data };
    if (dbPayload.sessionRate !== undefined) { dbPayload.session_rate = dbPayload.sessionRate; delete dbPayload.sessionRate; }
    if (dbPayload.whatsappNumber !== undefined) { dbPayload.whatsapp_number = dbPayload.whatsappNumber; delete dbPayload.whatsappNumber; }
    await supabaseClient.from('teachers').update(dbPayload).eq('id', id);
    await this.loadState();
    return this.getTeacher(id);
  }
  
  async deleteTeacher(id) {
    await supabaseClient.from('teachers').delete().eq('id', id);
    await this.loadState();
  }

  // ── Families ──
  getFamilies(filter = {}) {
    let list = [...this._data.families];
    if (filter.status) list = list.filter(f => f.status === filter.status);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(f => f.name.toLowerCase().includes(q));
    }
    return list;
  }
  getFamily(id) { return this._data.families.find(f => f.id === id) || null; }
  
  async addFamily(data) {
    const existing = this._data.families;
    let maxId = 0;
    existing.forEach(f => {
      if (f.id && typeof f.id === 'string' && f.id.includes('-')) {
        const num = parseInt(f.id.split('-')[1]);
        if (!isNaN(num) && num > maxId) maxId = num;
      }
    });
    const newId = `FAM-${String(maxId + 1).padStart(3,'0')}`;
    
    const dbPayload = { id: newId, join_date: new Date().toISOString().split('T')[0], ...data };
    if (dbPayload.monthlyFee) { dbPayload.monthly_fee = dbPayload.monthlyFee; delete dbPayload.monthlyFee; }
    
    await supabaseClient.from('families').insert([dbPayload]);
    await this.loadState();
    return this.getFamily(newId);
  }
  
  async updateFamily(id, data) {
    const dbPayload = { ...data };
    if (dbPayload.monthlyFee) { dbPayload.monthly_fee = dbPayload.monthlyFee; delete dbPayload.monthlyFee; }
    await supabaseClient.from('families').update(dbPayload).eq('id', id);
    await this.loadState();
    return this.getFamily(id);
  }
  
  async deleteFamily(id) {
    await supabaseClient.from('families').delete().eq('id', id);
    await this.loadState();
  }

  // ── Student Schedules ──

  getStudentSchedules(filter = {}) {
    let list = [...this._data.studentSchedules];
    if (filter.status) list = list.filter(s => s.status === filter.status);
    if (filter.studentId) list = list.filter(s => s.student_id === filter.studentId);
    return list.map(s => ({ ...s, studentId: s.student_id, teacherId: s.teacher_id, courseType: s.course_type, daysOfWeek: s.days_of_week, sessionTime: s.session_time, durationMin: s.duration_min, startDate: s.start_date }));
  }

  getStudentSchedule(studentId) {
    const s = this._data.studentSchedules.find(s => s.student_id === studentId && s.status === 'active');
    if (!s) {
      // Also check paused schedules (so we can resume them)
      const paused = this._data.studentSchedules.find(s => s.student_id === studentId);
      if (!paused) return null;
      return { ...paused, studentId: paused.student_id, teacherId: paused.teacher_id, courseType: paused.course_type, daysOfWeek: paused.days_of_week, sessionTime: paused.session_time, durationMin: paused.duration_min, startDate: paused.start_date };
    }
    return { ...s, studentId: s.student_id, teacherId: s.teacher_id, courseType: s.course_type, daysOfWeek: s.days_of_week, sessionTime: s.session_time, durationMin: s.duration_min, startDate: s.start_date };
  }

  getScheduleChangeLogs(studentId) {
    return this._data.scheduleChangeLogs
      .filter(l => l.student_id === studentId)
      .sort((a, b) => b.changed_at.localeCompare(a.changed_at));
  }

  /**
   * Main orchestrator: save/update a student schedule and regenerate sessions.
   * @param {Object} data - { studentId, teacherId, courseType, daysOfWeek, sessionTime, durationMin, startDate }
   */
  async saveStudentSchedule(data) {
    const { studentId, teacherId, courseType, daysOfWeek, sessionTime, durationMin, startDate } = data;

    // Load fresh state
    await this.loadState();

    // Find existing schedule for this student
    const existingRaw = this._data.studentSchedules.find(s => s.student_id === studentId);

    let scheduleId;
    const schedulePayload = {
      student_id: studentId,
      teacher_id: teacherId,
      course_type: courseType,
      days_of_week: daysOfWeek,
      session_time: sessionTime,
      duration_min: durationMin,
      start_date: startDate,
      status: 'active',
      updated_at: new Date().toISOString(),
    };

    if (existingRaw) {
      // Detect what changed for audit log
      const changedFields = {};
      if (JSON.stringify(existingRaw.days_of_week) !== JSON.stringify(daysOfWeek)) changedFields.days = daysOfWeek;
      if (existingRaw.session_time !== sessionTime) changedFields.time = sessionTime;
      if (existingRaw.teacher_id !== teacherId) changedFields.teacher = teacherId;
      if (existingRaw.course_type !== courseType) changedFields.course = courseType;
      if (existingRaw.duration_min !== durationMin) changedFields.duration = durationMin;

      scheduleId = existingRaw.id;
      await supabaseClient.from('student_schedules').update(schedulePayload).eq('id', scheduleId);

      // Cancel all future sessions from old schedule
      await this.cancelFutureSessionsForStudent(studentId, 'updated');

      await this._logScheduleChange(scheduleId, studentId, 'updated', JSON.stringify(changedFields));
    } else {
      // Create new schedule
      const { data: inserted, error } = await supabaseClient.from('student_schedules').insert([schedulePayload]).select();
      if (error) { console.error('Error inserting schedule:', error); throw error; }
      scheduleId = inserted[0].id;
      await this._logScheduleChange(scheduleId, studentId, 'created', null);
    }

    // Reload so we have the new schedule record
    await this.loadState();

    // Generate sessions for next 4 weeks starting from startDate (or today if startDate is past)
    const genFrom = new Date(startDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (genFrom < today) genFrom.setTime(today.getTime());

    const freshSched = this._data.studentSchedules.find(s => s.id === scheduleId);
    if (freshSched) {
      await this._generateAndInsertSessions(freshSched, genFrom);
    }

    await this.loadState();
    return scheduleId;
  }

  /**
   * Generate sessions for next 4 weeks from startFrom date and insert them.
   */
  async _generateAndInsertSessions(sched, startFrom) {
    const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const daysOfWeek = sched.days_of_week || [];
    const durationMin = sched.duration_min || 60;
    const sessionTime = typeof sched.session_time === 'string' ? sched.session_time.substring(0, 5) : '09:00';
    const teacherId = sched.teacher_id;
    const courseType = sched.course_type;
    const studentId = sched.student_id;
    const scheduleId = sched.id;

    // Generate 4 weeks (28 days) of sessions
    const endDate = new Date(startFrom);
    endDate.setDate(endDate.getDate() + 28);

    const sessionInserts = [];
    const current = new Date(startFrom);

    while (current <= endDate) {
      const dayName = DAY_NAMES[current.getDay()];
      if (daysOfWeek.includes(dayName)) {
        const dateStr = current.toISOString().split('T')[0];
        const sessionId = `SES-${Date.now()}-${Math.floor(Math.random()*9000)+1000}`;
        sessionInserts.push({
          id: sessionId,
          course_type: courseType,
          teacher_id: teacherId,
          date: dateStr,
          time: sessionTime,
          duration: durationMin,
          recurrence: 'weekly',
          status: 'scheduled',
          zoom_link: `https://us02web.zoom.us/j/${Math.floor(Math.random()*9000000000)+1000000000}`,
          notes: '',
          color: this._courseColor(courseType),
          schedule_id: scheduleId,
        });
      }
      current.setDate(current.getDate() + 1);
      // Small delay to ensure unique IDs
      await new Promise(r => setTimeout(r, 1));
    }

    if (sessionInserts.length === 0) return [];

    // Insert sessions in batches
    const { error: sessErr } = await supabaseClient.from('sessions').insert(sessionInserts);
    if (sessErr) { console.error('Error inserting sessions:', sessErr); }

    // Link each session to the student
    const studentLinks = sessionInserts.map(s => ({ session_id: s.id, student_id: studentId }));
    const { error: linkErr } = await supabaseClient.from('session_students').insert(studentLinks);
    if (linkErr) { console.error('Error inserting session_students:', linkErr); }

    return sessionInserts;
  }

  /**
   * Preview sessions that would be generated (no DB writes).
   * Returns array of { date, dayName } for the next N occurrences.
   */
  previewScheduleSessions(daysOfWeek, startDate, count = 4) {
    const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const results = [];
    const current = new Date(startDate);
    const today = new Date(); today.setHours(0,0,0,0);
    if (current < today) current.setTime(today.getTime());
    let safety = 0;
    while (results.length < count && safety < 120) {
      const dayName = DAY_NAMES[current.getDay()];
      if (daysOfWeek.includes(dayName)) {
        results.push({ date: current.toISOString().split('T')[0], dayName });
      }
      current.setDate(current.getDate() + 1);
      safety++;
    }
    return results;
  }

  /**
   * Cancel all future scheduled sessions for a student (date > today, status = scheduled/upcoming).
   */
  async cancelFutureSessionsForStudent(studentId, reason = 'cancelled') {
    const today = new Date().toISOString().split('T')[0];
    const futureSessions = this._data.sessions.filter(s => {
      const isForStudent = s.studentIds && s.studentIds.includes(studentId);
      const isFuture = s.date > today;
      const isCancellable = s.status === 'scheduled' || s.status === 'upcoming';
      return isForStudent && isFuture && isCancellable;
    });

    if (futureSessions.length === 0) return 0;

    const ids = futureSessions.map(s => s.id);
    await supabaseClient.from('sessions').update({ status: 'cancelled' }).in('id', ids);
    return ids.length;
  }

  /**
   * Cancel all future sessions generated by a specific schedule_id.
   */
  async cancelFutureSessionsBySchedule(scheduleId) {
    const today = new Date().toISOString().split('T')[0];
    const futureSessions = this._data.sessions.filter(s => {
      return s.schedule_id === scheduleId && s.date > today && (s.status === 'scheduled' || s.status === 'upcoming');
    });
    if (futureSessions.length === 0) return 0;
    const ids = futureSessions.map(s => s.id);
    await supabaseClient.from('sessions').update({ status: 'cancelled' }).in('id', ids);
    return ids.length;
  }

  _courseColor(courseType) {
    const map = { Quran: 'green', Arabic: 'blue', Fiqh: 'purple' };
    return map[courseType] || 'gray';
  }

  async _logScheduleChange(scheduleId, studentId, changeType, changedFields) {
    try {
      const user = window.currentUser || {};
      await supabaseClient.from('schedule_change_log').insert([{
        schedule_id: scheduleId,
        student_id: studentId,
        change_type: changeType,
        changed_fields: changedFields,
        changed_by: user.email || 'admin',
        changed_at: new Date().toISOString(),
      }]);
    } catch(e) { console.warn('Could not log schedule change:', e); }
  }

  // ── Sessions ──
  getSessions(filter = {}) {
    let list = [...this._data.sessions];
    if (filter.teacherId) list = list.filter(s => s.teacher_id === filter.teacherId || s.teacherId === filter.teacherId);
    if (filter.studentId) list = list.filter(s => s.studentIds && s.studentIds.includes(filter.studentId));
    if (filter.status) list = list.filter(s => s.status === filter.status);
    if (filter.date) list = list.filter(s => s.date === filter.date);
    if (filter.month) list = list.filter(s => s.date && s.date.startsWith(filter.month));
    list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    
    // Map db fields to UI fields
    return list.map(s => ({...s, teacherId: s.teacher_id, courseType: s.course_type, zoomLink: s.zoom_link }));
  }
  getSession(id) { 
    const s = this._data.sessions.find(s => s.id === id) || null; 
    return s ? {...s, teacherId: s.teacher_id, courseType: s.course_type, zoomLink: s.zoom_link } : null;
  }
  
  async addSession(data) {
    const id = `SES-${String(Date.now()).slice(-6)}`;
    const sessionPayload = {
      id,
      zoom_link: `https://us02web.zoom.us/j/${Math.floor(Math.random()*9000000000)+1000000000}`,
      status: 'upcoming',
      notes: '',
      course_type: data.courseType,
      teacher_id: data.teacherId,
      date: data.date,
      time: data.time,
      duration: data.duration,
      recurrence: data.recurrence,
      color: data.color
    };
    
    await supabaseClient.from('sessions').insert([sessionPayload]);
    
    if (data.studentIds && data.studentIds.length > 0) {
      const studentLinks = data.studentIds.map(stId => ({ session_id: id, student_id: stId }));
      await supabaseClient.from('session_students').insert(studentLinks);
    }
    
    await this.loadState();
    return this.getSession(id);
  }
  
  async updateSession(id, data) {
    const dbPayload = { ...data };
    if (dbPayload.courseType) { dbPayload.course_type = dbPayload.courseType; delete dbPayload.courseType; }
    if (dbPayload.teacherId) { dbPayload.teacher_id = dbPayload.teacherId; delete dbPayload.teacherId; }
    if (dbPayload.zoomLink) { dbPayload.zoom_link = dbPayload.zoomLink; delete dbPayload.zoomLink; }
    if (dbPayload.studentIds) delete dbPayload.studentIds;
    
    await supabaseClient.from('sessions').update(dbPayload).eq('id', id);
    
    if (data.studentIds) {
      await supabaseClient.from('session_students').delete().eq('session_id', id);
      const studentLinks = data.studentIds.map(stId => ({ session_id: id, student_id: stId }));
      await supabaseClient.from('session_students').insert(studentLinks);
    }
    
    await this.loadState();
    return this.getSession(id);
  }
  
  async deleteSession(id) {
    await supabaseClient.from('sessions').delete().eq('id', id);
    await this.loadState();
  }

  // ── Attendance ──
  getAttendance(filter = {}) {
    let list = [...this._data.attendance];
    if (filter.sessionId) list = list.filter(a => a.session_id === filter.sessionId);
    if (filter.studentId) list = list.filter(a => a.student_id === filter.studentId);
    return list.map(a => ({...a, sessionId: a.session_id, studentId: a.student_id, markedAt: a.marked_at}));
  }
  
  async markAttendance(sessionId, records) {
    for (const rec of records) {
      const existing = this._data.attendance.find(a => a.session_id === sessionId && a.student_id === rec.studentId);
      if (existing) {
        await supabaseClient.from('attendance').update({ status: rec.status, notes: rec.notes || '', marked_at: new Date().toISOString() }).eq('id', existing.id);
      } else {
        await supabaseClient.from('attendance').insert([{
          id: `ATT-${String(Date.now()).slice(-6)}-${rec.studentId}`,
          session_id: sessionId, 
          student_id: rec.studentId, 
          status: rec.status,
          notes: rec.notes || '', 
          marked_at: new Date().toISOString()
        }]);
      }
    }
    await this.loadState();
  }

  // ── Payments ──
  getPayments(filter = {}) {
    let list = [...this._data.payments];
    if (filter.familyId) list = list.filter(p => p.family_id === filter.familyId);
    if (filter.status) list = list.filter(p => p.status === filter.status);
    if (filter.month) list = list.filter(p => p.month === filter.month);
    return list.map(p => ({...p, familyId: p.family_id, paidDate: p.paid_date}));
  }

  // ── Notifications ──
  getNotifications() { return [...this._data.notifications].map(n => ({ ...n, read: n.is_read })); }
  
  async markNotificationsRead() {
    await supabaseClient.from('notifications').update({ is_read: true }).eq('is_read', false);
    await this.loadState();
  }
  
  async addNotification(notif) {
    await supabaseClient.from('notifications').insert([{ id: `n_${Date.now()}`, is_read: false, time: 'just now', ...notif }]);
    await this.loadState();
  }

  // ── Evaluations ──
  getEvaluations(filter = {}) {
    let list = [...this._data.evaluations];
    if (filter.studentId) list = list.filter(e => e.student_id === filter.studentId);
    if (filter.teacherId) list = list.filter(e => e.teacher_id === filter.teacherId);
    if (filter.month) list = list.filter(e => e.month === filter.month);
    return list.map(e => ({...e, studentId: e.student_id, teacherId: e.teacher_id, courseType: e.course_type, recitationScore: e.recitation_score, memorizationScore: e.memorization_score, tajweedScore: e.tajweed_score}));
  }

  async addEvaluation(data) {
    const existing = this._data.evaluations.find(e => e.student_id === data.studentId && e.month === data.month && e.course_type === data.courseType);
    
    const dbPayload = {
       student_id: data.studentId,
       teacher_id: data.teacherId,
       course_type: data.courseType,
       month: data.month,
       recitation_score: data.recitationScore,
       memorization_score: data.memorizationScore,
       tajweed_score: data.tajweedScore,
       notes: data.notes
    };

    if (existing) {
       await supabaseClient.from('evaluations').update(dbPayload).eq('id', existing.id);
    } else {
       dbPayload.id = `EVL-${String(Date.now()).slice(-6)}`;
       await supabaseClient.from('evaluations').insert([dbPayload]);
    }
    
    await this.loadState();
  }

  // ── Aggregated Stats (Admin Dashboard) ──
  getDashboardStats() {
    const students = this.getStudents();
    const teachers = this.getTeachers();
    const sessions = this.getSessions();
    const attendance = this.getAttendance();
    const payments = this.getPayments();

    const activeStudents = students.filter(s => s.status === 'active').length;
    const activeTeachers = teachers.filter(t => t.status === 'active').length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const upcomingSessions = sessions.filter(s => s.status === 'upcoming').length;

    const totalAttendance = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    const currentMonth = new Date().toISOString().slice(0,7);
    const currentPayments = payments.filter(p => p.month === currentMonth);
    const monthRevenue = currentPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const monthExpenses = teachers.reduce((sum, t) => sum + ((t.session_rate || 20) * (t.sessions || 0)), 0);
    const profit = monthRevenue - monthExpenses;

    // Monthly revenue trend
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0,7);
      const rev = payments.filter(p => p.month === key && p.status === 'paid').reduce((sum,p) => sum + p.amount, 0);
      months.push({ month: d.toLocaleString('default',{month:'short'}), revenue: rev });
    }

    const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'overdue').length;

    return {
      activeStudents, activeTeachers, completedSessions, upcomingSessions,
      attendanceRate, monthRevenue, monthExpenses, profit, pendingPayments,
      revenueByMonth: months,
      growthRate: 12.4,
      churnRate: 3.2
    };
  }
}

// Global DB instance
window.DB = new AcademyDB();
