/* ================================================
   I18N.JS — Internationalization and RTL logic
   ================================================ */
'use strict';

const I18N = {
  currentLang: localStorage.getItem('i18n_lang') || 'en',
  
  dict: {
    ar: {
      "Dar Al-Arqam Academy": "أكاديمية دار الأرقم",
      "Management System": "نظام الإدارة",
      "Sign in to your portal": "تسجيل الدخول إلى بوابتك",
      "Email Address": "البريد الإلكتروني",
      "Password": "كلمة المرور",
      "Sign In": "تسجيل الدخول",
      "Demo Accounts": "حسابات تجريبية",
      "Admin": "مدير",
      "Teacher": "معلم",
      "Student": "طالب",
      "Parent": "ولي أمر",
      
      // Sidebar & Nav
      "Dashboard": "لوحة القيادة",
      "Students": "الطلاب",
      "Teachers": "المعلمون",
      "Schedule": "الجدول الزمني",
      "Families": "العائلات",
      "Finance": "المالية",
      "Communications": "الرسائل",
      "Attendance": "الحضور",
      "My Schedule": "جدولي",
      "Sign Out": "تسجيل خروج",
      "Notifications": "الإشعارات",
      "Mark all read": "تحديد الكل كمقروء",
      
      // Navigation / Sidebar
      "Overview": "نظرة عامة",
      "Management": "الإدارة",
      "Academic": "الأكاديمية",
      "Financial": "مالي",
      "Communication": "التواصل",
      "My Portal": "بوابتي",
      "My Sessions": "جلساتي",
      "My Attendance": "سجل حضوري",
      "Family Portal": "بوابة العائلة",
      "Billing": "الفواتير",

      // Dashboards generic
      "Active Students": "الطلاب النشطين",
      "Sessions Today": "جلسات اليوم",
      "Upcoming Sessions": "الجلسات القادمة",
      "Recent Activity": "النشاط الأخير",
      "Good": "طاب",
      "morning": "صباحك",
      "afternoon": "يومك",
      "evening": "مساءك",
      "Welcome back": "مرحباً بعودتك",
      "Sessions Done": "الجلسات المنجزة",
      "Monthly Revenue": "الإيرادات الشهرية",
      "Expenses": "المصروفات",
      "Attendance Rate": "معدل الحضور",
      "Today's Sessions": "جلسات اليوم",
      "Marketing Performance": "أداء التسويق",
      "Recent Enrollments": "التسجيلات الحديثة",
      "View All Students": "عرض جميع الطلاب",
      "Recent Attendance": "سجل الحضور الأخير",
      "Code": "الرمز",
      "Family": "العائلة",
      "Courses": "الدورات",
      "Status": "الحالة",
      "Joined": "تاريخ الانضمام",
      "Session": "الجلسة",
      "Date": "التاريخ",
      "Overall attendance": "إجمالي الحضور",
      "Rate": "معدل",
      "No notifications": "لا توجد إشعارات",

      "Teachers": "المعلمون",
      "educators on the team": "معلماً في الفريق",
      "Add Teacher": "إضافة معلم",
      "All Teachers": "جميع المعلمين",
      "Search teachers...": "البحث عن معلمين...",
      "Teacher": "المعلم",
      "Specialization": "التخصص",
      "Sessions": "الجلسات",
      "Rate/Session": "السعر/للجلسة",
      "Actions": "إجراءات",
      "Done": "مكتملة",
      "Upcoming": "قادمة",
      "Active": "نشط",
      "Inactive": "غير نشط",
      "total": "الإجمالي",
      "View": "عرض",
      "Edit": "تعديل",
      "Remove": "حذف",
      "Profile": "الملف الشخصي",
      "Email": "البريد الإلكتروني",
      "session": "جلسة",
      "Total Sessions": "إجمالي الجلسات",
      "completed": "مكتملة",
      "Bio": "نبذة",
      "Estimated Monthly Pay": "الدفع الشهري التقديري",
      "No teachers found": "لا يوجد معلمين",

      "Students": "الطلاب",
      "enrolled students across all families": "طالب مسجل",
      "Add Student": "إضافة طالب",
      "Quran Students": "طلاب القرآن",
      "Arabic Students": "طلاب العربية",
      "Fiqh Students": "طلاب الفقه",
      "Search by name or code...": "البحث بالاسم أو الرمز...",
      "All Status": "جميع الحالات",
      "All Courses": "جميع الدورات",
      "Age / Grade": "العمر / الصف",
      "Joined": "تاريخ الانضمام",
      "View Details": "عرض التفاصيل",
      "No students found": "لم يتم العثور على طلاب",
      "yrs": "سنوات",
      "years": "سنوات",
      "Attendance Summary": "ملخص الحضور",
      "Present": "حاضر",
      "Absent": "غائب",
      "Late": "متأخر",
      "Quran": "القرآن",
      "Arabic": "اللغة العربية",
      "Fiqh": "الفقه",

      "Manage all sessions, recurrences, and calendar": "إدارة جميع الجلسات والجدول الزمني",
      "List View": "عرض القائمة",
      "Calendar View": "عرض التقويم",
      "New Session": "جلسة جديدة",
      "Time": "الوقت",
      "Course": "الدورة",
      "Duration": "المدة",
      "Recurrence": "التكرار",
      "student(s)": "طالب",
      "Cancel": "إلغاء",
      "Zoom Link": "رابط زووم",
      "Join Meeting": "دخول الاجتماع",
      "Notes": "ملاحظات",
      "Edit Session": "تعديل الجلسة",
      "Course Type": "نوع الدورة",
      "Start Time": "وقت البدء",
      "minutes": "دقيقة",
      "Save Changes": "حفظ التغييرات",
      "No sessions": "لا توجد جلسات",
      "Past Sessions": "الجلسات السابقة",

      "Families & Accounts": "العائلات والحسابات",
      "Manage family accounts and billing plans": "إدارة حسابات العائلات والفواتير",
      "New Family": "عائلة جديدة",
      "ID": "المعرف",
      "Contact": "التواصل",
      "Plan": "الخطة",
      "Monthly Fee": "الرسوم الشهرية",
      "mo": "شهر",
      "Back to All Families": "العودة لجميع العائلات",
      "Parent Email": "بريد ولي الأمر",
      "Phone": "الهاتف",
      "Join Date": "تاريخ الانضمام",
      "Edit Family Details": "تعديل تفاصيل العائلة",
      "Children / Students": "الأبناء / الطلاب",
      "Add Child": "إضافة ابن",
      "Full Name": "الاسم الكامل",
      "No children enrolled yet.": "لا يوجد أبناء مسجلين بعد.",
      "premium": "المميزة",
      "standard": "الأساسية",
      "basic": "العادية",

      "Financial Overview": "نظرة عامة مالية",
      "Revenue, expenses, and profit tracking": "تتبع الإيرادات والمصروفات والأرباح",
      "Generate P&L Report": "إنشاء تقرير الأرباح والخسائر",
      "This Month Revenue": "إيرادات هذا الشهر",
      "families paid": "عائلة دفعت",
      "This Month Expenses": "مصروفات هذا الشهر",
      "Teacher fees + software + marketing": "رواتب معلمين + برامج + تسويق",
      "Net Profit": "صافي الربح",
      "Margin": "الهامش",
      "Payment Records": "سجلات الدفع",
      "Amount": "المبلغ",
      "Paid Date": "تاريخ الدفع",
      "Method": "الطريقة",
      "Paid": "مدفوع",
      "Pending": "معلق",
      "Overdue": "متأخر",
      "Month": "الشهر",

      "Communication Center": "مركز الرسائل",
      "Automated notifications, templates, and delivery logs": "إشعارات تلقائية وسجلات التوصيل",
      "Send Notification": "إرسال إشعار",
      "Emails Sent": "رسائل البريد",
      "open rate": "معدل الفتح",
      "SMS Sent": "الرسائل القصيرة",
      "delivered": "تم التوصيل",
      "In-App Alerts": "تنبيهات التطبيق",
      "All portals": "جميع البوابات",
      "Delivery Rate": "معدل التوصيل",
      "Industry leading": "رائد في القطاع",
      "Auto-Notification Templates": "قوالب الإشعارات التلقائية",
      "Template editor coming in Phase 3": "محرر القوالب في المرحلة 3",
      "Edit Templates": "تعديل القوالب",
      "Recent Notifications": "الإشعارات الحديثة",
      "unread": "غير مقروءة",
      "Notification Log": "سجل الإشعارات",
      "All Types": "جميع الأنواع",
      "Session Reminder": "تذكير بالجلسة",
      "Payment": "المدفوعات",
      "Absence": "الغياب",
      "Cancellation": "إلغاء",
      "Recipient": "المستلم",
      "Type": "النوع",
      "Message": "الرسالة",
      "Channel": "القناة",
      "Sent": "تم الإرسال"
    }
  },

  t(key) {
    if (this.currentLang === 'en') return key;
    return this.dict[this.currentLang]?.[key] || key;
  },

  setLang(lang) {
    this.currentLang = lang;
    localStorage.setItem('i18n_lang', lang);
    
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
    
    // Process all data-i18n nodes on the current DOM
    this.translateDOM();
    
    // Re-render current mapped pages
    if (window.Router && window.Router.currentPage) {
      window.Router.navigate(window.Router.currentPage);
    }
    if (window.UI) {
      if(window.Auth && window.Auth.isLoggedIn()) {
        UI.updateHeaderDate();
      }
    }
    // Update Sidebar
    if (window.Router && window.Auth && window.Auth.isLoggedIn()) {
      window.Router.buildSidebar();
    }
  },

  translateDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
  },
  
  toggle() {
    this.setLang(this.currentLang === 'en' ? 'ar' : 'en');
  }
};

window.t = I18N.t.bind(I18N);

// Initialize early
document.addEventListener('DOMContentLoaded', () => {
  I18N.setLang(I18N.currentLang);
  
  // Wire up toggle button
  const toggleBtn = document.getElementById('lang-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      I18N.toggle();
      toggleBtn.textContent = I18N.currentLang === 'en' ? 'ع' : 'EN';
    });
    toggleBtn.textContent = I18N.currentLang === 'en' ? 'ع' : 'EN';
  }
});
