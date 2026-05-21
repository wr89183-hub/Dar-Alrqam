/* ================================================
   CHATBOT.JS — AI Assistant Integration (Gemini)
   ================================================ */
'use strict';

class AdminAssistant {
  constructor() {
    this.apiKey = localStorage.getItem('dar_gemini_api_key') || '';
    this.messages = [
      {
        role: 'system',
        parts: [{ text: "You are Dar AI, an intelligent assistant for the Admin of Dar Al-Arqam Academy. You speak Arabic and English. You have tools to read the database and execute actions like adding sessions, assigning teachers, etc. Always confirm with the user after executing an action." }]
      }
    ];
    this.initUI();
  }

  initUI() {
    this.widget = document.getElementById('ai-chatbot-widget');
    this.btn = document.getElementById('ai-chat-btn');
    this.panel = document.getElementById('ai-chat-panel');
    this.closeBtn = document.getElementById('ai-chat-close-btn');
    this.settingsBtn = document.getElementById('ai-chat-settings-btn');
    this.settingsPanel = document.getElementById('ai-chat-settings-panel');
    this.apiKeyInput = document.getElementById('ai-api-key-input');
    this.apiKeySave = document.getElementById('ai-api-key-save');
    
    this.chatMessages = document.getElementById('ai-chat-messages');
    this.chatInput = document.getElementById('ai-chat-input');
    this.chatSend = document.getElementById('ai-chat-send');

    if (!this.widget) return;

    this.apiKeyInput.value = this.apiKey;

    this.btn.addEventListener('click', () => this.togglePanel());
    this.closeBtn.addEventListener('click', () => this.togglePanel());
    
    this.settingsBtn.addEventListener('click', () => {
      this.settingsPanel.classList.toggle('hidden');
    });

    this.apiKeySave.addEventListener('click', () => {
      this.apiKey = this.apiKeyInput.value.trim();
      localStorage.setItem('dar_gemini_api_key', this.apiKey);
      this.settingsPanel.classList.add('hidden');
      this.appendMessage('bot', 'API Key saved successfully!');
    });

    this.chatSend.addEventListener('click', () => this.handleSend());
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSend();
    });
  }

  togglePanel() {
    this.panel.classList.toggle('hidden');
    if (!this.panel.classList.contains('hidden')) {
      this.chatInput.focus();
    }
  }

  appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = `ai-msg ai-msg-${role}`;
    div.textContent = text;
    this.chatMessages.appendChild(div);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  async handleSend() {
    const text = this.chatInput.value.trim();
    if (!text) return;

    if (!this.apiKey) {
      this.appendMessage('system', 'Please enter your Gemini API Key in the settings first.');
      this.settingsPanel.classList.remove('hidden');
      return;
    }

    this.appendMessage('user', text);
    this.chatInput.value = '';
    this.chatInput.disabled = true;
    this.chatSend.disabled = true;

    // Add user message to history
    this.messages.push({ role: 'user', parts: [{ text }] });

    try {
      await this.callGemini();
    } catch (err) {
      console.error(err);
      this.appendMessage('system', 'Error connecting to AI: ' + err.message);
    } finally {
      this.chatInput.disabled = false;
      this.chatSend.disabled = false;
      this.chatInput.focus();
    }
  }

  getTools() {
    return [{
      functionDeclarations: [
        {
          name: "get_teachers",
          description: "Get a list of all teachers in the academy with their IDs and names.",
        },
        {
          name: "get_students",
          description: "Get a list of all students in the academy with their IDs and names.",
        },
        {
          name: "add_session",
          description: "Schedule a new session for a student with a teacher.",
          parameters: {
            type: "OBJECT",
            properties: {
              teacherId: { type: "STRING", description: "The ID of the teacher (e.g. TCH-0001)" },
              studentIds: { type: "ARRAY", items: { type: "STRING" }, description: "Array of student IDs (e.g. ['STU-0001'])" },
              date: { type: "STRING", description: "Date of the session (YYYY-MM-DD)" },
              time: { type: "STRING", description: "Time of the session (HH:MM)" },
              duration: { type: "INTEGER", description: "Duration in minutes" },
              courseType: { type: "STRING", description: "Type of course (quran, arabic, fiqh)" }
            },
            required: ["teacherId", "studentIds", "date", "time", "duration", "courseType"]
          }
        },
        {
          name: "add_teacher",
          description: "Add a new teacher to the system.",
          parameters: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING", description: "Teacher's full name" },
              email: { type: "STRING", description: "Teacher's email address" },
              whatsappNumber: { type: "STRING", description: "WhatsApp number" },
              sessionRate: { type: "INTEGER", description: "Pay rate per session (e.g. 50)" },
              specialization: { type: "ARRAY", items: { type: "STRING" }, description: "Array of subjects (e.g. ['quran', 'arabic'])" }
            },
            required: ["name", "email", "whatsappNumber"]
          }
        },
        {
          name: "add_student",
          description: "Add a new student to the system.",
          parameters: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING", description: "Student's full name" },
              familyId: { type: "STRING", description: "ID of the family (e.g. FAM-001)" },
              email: { type: "STRING", description: "Student's email address" },
              whatsappNumber: { type: "STRING", description: "WhatsApp number" },
              sessionRate: { type: "INTEGER", description: "Charge rate per session for the student (e.g. 10)" }
            },
            required: ["name", "familyId"]
          }
        },
        {
          name: "add_family",
          description: "Add a new family to the system.",
          parameters: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING", description: "Family's name (e.g. The Smith Family)" },
              email: { type: "STRING", description: "Family's email address" },
              phone: { type: "STRING", description: "Family's phone number" }
            },
            required: ["name", "email", "phone"]
          }
        },
        {
          name: "generate_invoice",
          description: "Generate a PDF invoice for a teacher or a family/student.",
          parameters: {
            type: "OBJECT",
            properties: {
              targetId: { type: "STRING", description: "The ID of the teacher, student, or family (e.g. TCH-0001, FAM-001, STU-0001)" },
              type: { type: "STRING", description: "Type of invoice: 'teacher' or 'student'/'family'" },
              fromDate: { type: "STRING", description: "Optional start date (YYYY-MM-DD)" },
              toDate: { type: "STRING", description: "Optional end date (YYYY-MM-DD)" }
            },
            required: ["targetId", "type"]
          }
        }
      ]
    }];
  }

  async callGemini() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
    
    // Filter out system message if it's not supported as first message, or format it as user/model correctly.
    // Gemini handles system_instruction separately in v1beta.
    const systemInstruction = {
      parts: [{ text: this.messages[0].parts[0].text }]
    };
    
    // History without the first system prompt
    const contents = this.messages.slice(1).map(m => ({
      role: m.role === 'bot' ? 'model' : (m.role === 'function' ? 'function' : 'user'),
      parts: m.parts
    }));

    const body = {
      system_instruction: systemInstruction,
      contents: contents,
      tools: this.getTools()
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error?.message || 'API Error');
    }

    const data = await res.json();
    const candidate = data.candidates && data.candidates[0];
    
    if (!candidate) return;

    const parts = candidate.content.parts;
    
    for (const part of parts) {
      if (part.text) {
        this.appendMessage('bot', part.text);
        this.messages.push({ role: 'bot', parts: [{ text: part.text }] });
      } else if (part.functionCall) {
        // AI wants to call a function
        const fnName = part.functionCall.name;
        const args = part.functionCall.args;
        this.appendMessage('system', `Executing: ${fnName}...`);
        
        let result = await this.executeFunction(fnName, args);
        
        // Add model's functionCall to history
        this.messages.push({ role: 'model', parts: [{ functionCall: part.functionCall }] });
        
        // Send function response back to Gemini
        const functionResponsePart = {
          functionResponse: {
            name: fnName,
            response: { result: result }
          }
        };
        
        this.messages.push({ role: 'user', parts: [functionResponsePart] });
        
        // Call Gemini again with the result
        await this.callGemini();
        return; // Prevents duplicate execution flow
      }
    }
  }

  async executeFunction(name, args) {
    try {
      if (name === 'get_teachers') {
        const teachers = window.DB.getTeachers().map(t => ({ id: t.id, name: t.name }));
        return JSON.stringify(teachers);
      } 
      else if (name === 'get_students') {
        const students = window.DB.getStudents().map(s => ({ id: s.id, name: s.name }));
        return JSON.stringify(students);
      }
      else if (name === 'add_session') {
        const session = await window.DB.addSession({
          teacherId: args.teacherId,
          studentIds: args.studentIds,
          date: args.date,
          time: args.time,
          duration: args.duration || 30,
          courseType: args.courseType || 'quran',
          color: '#2ECC71',
          recurrence: 'none'
        });
        // Force UI update if we're on the schedule page
        if (window.Router && window.Router.currentPage === 'admin-schedule') {
          window.Router.navigate('admin-schedule', true);
        }
        return JSON.stringify({ success: true, session: session });
      }
      else if (name === 'add_teacher') {
        const teacher = await window.DB.addTeacher({
          name: args.name,
          email: args.email,
          whatsappNumber: args.whatsappNumber,
          sessionRate: args.sessionRate || 50,
          specialization: args.specialization || ['quran']
        });
        if (window.Router && window.Router.currentPage === 'admin-teachers') window.Router.navigate('admin-teachers', true);
        return JSON.stringify({ success: true, teacher: teacher });
      }
      else if (name === 'add_student') {
        const student = await window.DB.addStudent({
          name: args.name,
          familyId: args.familyId,
          email: args.email || '',
          whatsappNumber: args.whatsappNumber || '',
          sessionRate: args.sessionRate || 10
        });
        if (window.Router && window.Router.currentPage === 'admin-students') window.Router.navigate('admin-students', true);
        return JSON.stringify({ success: true, student: student });
      }
      else if (name === 'add_family') {
        const family = await window.DB.addFamily({
          name: args.name,
          email: args.email,
          phone: args.phone,
          status: 'active'
        });
        if (window.Router && window.Router.currentPage === 'admin-families') window.Router.navigate('admin-families', true);
        return JSON.stringify({ success: true, family: family });
      }
      else if (name === 'generate_invoice') {
        if (args.type === 'teacher') {
          window.generateTeacherInvoicePDF(args.targetId, args.fromDate, args.toDate);
          return JSON.stringify({ success: true, message: "Teacher invoice generated and downloaded." });
        } else {
          window.generateStudentInvoicePDF(args.targetId, args.fromDate, args.toDate);
          return JSON.stringify({ success: true, message: "Student/Family invoice generated and downloaded." });
        }
      }
      return JSON.stringify({ error: "Function not found" });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  }

  show() {
    if (this.widget) this.widget.classList.remove('hidden');
  }

  hide() {
    if (this.widget) this.widget.classList.add('hidden');
  }
}

// Global instance
window.AI = new AdminAssistant();
