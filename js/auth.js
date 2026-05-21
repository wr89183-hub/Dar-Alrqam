/* ================================================
   AUTH.JS — Authentication & Session Management (Supabase)
   ================================================ */
'use strict';

const Auth = {
  currentUser: null,

  async init() {
    if (!window.supabaseClient) return false;
    
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      const res = await this.fetchProfile(session.user);
      if (res) {
        // Hydrate DB on initial load
        await window.DB.loadState();
      }
      return res;
    }
    return false;
  },

  async fetchProfile(user) {
    // Actually, sometimes user profile comes from user_profiles table.
    // If not found, fall back to users data loaded in DB if available,
    // Or fetch directly.
    const { data: profile, error } = await supabaseClient.from('user_profiles').select('*').eq('id', user.id).single();
    
    if (error || !profile) {
      // In a fresh migration step, admin might not have a profile, fallback for robustness
      // Normally we'd return false here to demand a profile.
    }

    if (profile) {
      this.currentUser = {
        id: user.id, email: profile.email, name: profile.name,
        role: profile.role, refId: profile.ref_id, avatar: profile.avatar || profile.name.charAt(0).toUpperCase(),
        approvalStatus: profile.approval_status
      };
      return true;
    }
    return false;
  },

  async login(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return await this._finalizeLogin(data.user);
  },

  async sendOtp(email) {
    const { error } = await supabaseClient.auth.signInWithOtp({ 
      email,
      options: { shouldCreateUser: false }
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  async verifyOtp(email, token) {
    const { data, error } = await supabaseClient.auth.verifyOtp({ email, token, type: 'email' });
    if (error) return { ok: false, error: error.message };
    return await this._finalizeLogin(data.user);
  },

  async register(payload) {
    const { firstName, lastName, email, password, whatsappNumber, role } = payload;
    const name = `${firstName} ${lastName}`;
    
    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { name, role, whatsapp: whatsappNumber }
      }
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  async createManagerUserAccount({ email, password, name, role, whatsapp, refId }) {
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      console.error('Supabase keys missing.');
      return { ok: false, error: 'Configuration missing' };
    }
    
    // Create a temporary client to avoid signing out the manager
    const tempSupabase = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    
    const { data: authData, error: authError } = await tempSupabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role, whatsapp: whatsapp || '', refId: refId }
      }
    });
    
    if (authError) {
      console.error('Failed to create account:', authError);
      return { ok: false, error: authError.message };
    }
    
    if (authData?.user) {
      // Ensure the profile is created instantly with the correct reference ID
      const approval = role === 'teacher' ? 'approved' : 'approved'; // Since manager creates it, it's approved natively
      const { error: profileError } = await supabaseClient.from('user_profiles').insert([{
        id: authData.user.id,
        email,
        name,
        role,
        whatsapp_number: whatsapp || '',
        approval_status: approval,
        ref_id: refId
      }]);
      
      if (profileError) {
        console.error('Failed creating profile:', profileError);
        return { ok: false, error: profileError.message };
      }
    }
    
    return { ok: true };
  },

  async _finalizeLogin(user) {
    const success = await this.fetchProfile(user);
    if (!success) {
      // Auto-reconstruct from OTP metadata if it's a first time registration
      if (user.user_metadata && user.user_metadata.role) {
        const approval = (user.user_metadata.role === 'teacher' || user.user_metadata.role === 'student') ? 'pending' : 'approved';
        const profilePayload = {
           id: user.id, email: user.email, name: user.user_metadata.name, 
           role: user.user_metadata.role, whatsapp_number: user.user_metadata.whatsapp,
           approval_status: approval
        };
        if (user.user_metadata.refId) {
            profilePayload.ref_id = user.user_metadata.refId;
        }

        const { error: profileError } = await supabaseClient.from('user_profiles').insert([profilePayload]);
        if (profileError) {
            await this.logout();
            return { ok: false, error: `Profile DB Error: ${profileError.message}` };
        }
        
        // If they did not come from an admin invite (no refId), we check for existing email
        if (!user.user_metadata.refId) {
            if (user.user_metadata.role === 'student') {
                const existingStudent = DB.getStudents().find(s => s.email && s.email.toLowerCase() === user.email.toLowerCase());
                if (existingStudent) {
                    await supabaseClient.from('user_profiles').update({ ref_id: existingStudent.id }).eq('id', user.id);
                } else {
                    const sid = `STU-${String(Date.now()).slice(-4)}`;
                    const { error: stuError } = await supabaseClient.from('students').insert([{ id: sid, name: user.user_metadata.name }]);
                    if (stuError) {
                        return { ok: false, error: `Student DB Error: ${stuError.message}` };
                    }
                    await supabaseClient.from('user_profiles').update({ ref_id: sid }).eq('id', user.id);
                }
            } else if (user.user_metadata.role === 'teacher') {
                const existingTeacher = DB.getTeachers().find(t => t.email && t.email.toLowerCase() === user.email.toLowerCase());
                if (existingTeacher) {
                    await supabaseClient.from('user_profiles').update({ ref_id: existingTeacher.id }).eq('id', user.id);
                } else {
                    const tid = `TCH-${String(Date.now()).slice(-4)}`;
                    const { error: tchError } = await supabaseClient.from('teachers').insert([{ id: tid, name: user.user_metadata.name, email: user.email }]);
                    if (tchError) {
                        return { ok: false, error: `Teacher DB Error: ${tchError.message}` };
                    }
                    await supabaseClient.from('user_profiles').update({ ref_id: tid }).eq('id', user.id);
                }
            }
        }

        const successretry = await this.fetchProfile(user);
        if (!successretry) {
           await this.logout();
           return { ok: false, error: 'Registration failed: Unable to fetch profile after creation.' };
        }
      } 
      // fallback admin
      else if (user.email === 'admin@daralarqam.com') {
         await supabaseClient.from('user_profiles').insert([{
           id: user.id, email: user.email, name: 'Waleed Ramadan', role: 'admin'
         }]);

         await this.fetchProfile(user);
      } else {
         await this.logout();
         return { ok: false, error: 'User profile missing.' };
      }
    }
    
    // Check approval
    if ((this.currentUser.role === 'teacher' || this.currentUser.role === 'student') && this.currentUser.approvalStatus === 'pending') {
       await this.logout();
       return { ok: false, error: 'Your account is pending admin approval. Please wait to be approved.' };
    }
    
    await window.DB.loadState();
    return { ok: true, user: this.currentUser };
  },

  async logout() {
    await supabaseClient.auth.signOut();
    this.currentUser = null;
    window.DB.reset && window.DB.reset();
  },

  isLoggedIn() { return !!this.currentUser; },
  getRole()    { return this.currentUser?.role || null; },
  getName()    { return this.currentUser?.name || ''; },
  getRefId()   { return this.currentUser?.refId || null; },
  getAvatar()  { return this.currentUser?.avatar || '?'; },

  requireRole(...roles) {
    if (!this.isLoggedIn()) return false;
    return roles.includes(this.getRole());
  }
};

window.Auth = Auth;
