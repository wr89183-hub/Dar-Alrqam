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
    };
    this.isLoaded = false;
  }

  // Called after login or on app start to sync data
  async loadState() {
    if (!window.supabaseClient) return;
    
    const [profRes, famRes, stuRes, tchrRes, sessRes, attRes, payRes, notifRes, evalRes] = await Promise.all([
      supabaseClient.from('user_profiles').select('*'),
      supabaseClient.from('families').select('*'),
      supabaseClient.from('students').select('*'),
      supabaseClient.from('teachers').select('*'),
      supabaseClient.from('sessions').select('*'),
      supabaseClient.from('attendance').select('*'),
      supabaseClient.from('payments').select('*'),
      supabaseClient.from('notifications').select('*'),
      supabaseClient.from('evaluations').select('*')
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
    const dbPayload = { ...data };
    if (dbPayload.familyId) { dbPayload.family_id = dbPayload.familyId; delete dbPayload.familyId; }
    if (dbPayload.sessionRate !== undefined) delete dbPayload.sessionRate;
    if (dbPayload.session_rate !== undefined) delete dbPayload.session_rate;
    if (dbPayload.email !== undefined) delete dbPayload.email;
    
    const { error } = await supabaseClient.from('students').update(dbPayload).eq('id', id);
    if (error) console.error("Error updating student:", error);
    
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
