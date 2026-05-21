-- ========================================================================================
-- ACADEMY MANAGEMENT SYSTEM - SUPABASE SCHEMA & MIGRATION SCRIPT
-- ========================================================================================

-- 1. Create Tables

CREATE TABLE public.families (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    plan TEXT,
    monthly_fee INTEGER,
    status TEXT DEFAULT 'active',
    join_date DATE
);

CREATE TABLE public.students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    family_id TEXT REFERENCES public.families(id) ON DELETE SET NULL,
    age INTEGER,
    grade TEXT,
    status TEXT DEFAULT 'active',
    courses TEXT[],
    join_date DATE,
    avatar TEXT
);

CREATE TABLE public.teachers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    specialization TEXT[],
    status TEXT DEFAULT 'active',
    session_rate INTEGER,
    sessions INTEGER DEFAULT 0,
    avatar TEXT,
    whatsapp_number TEXT,
    join_date DATE,
    bio TEXT
);

CREATE TABLE public.sessions (
    id TEXT PRIMARY KEY,
    course_type TEXT,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE SET NULL,
    date DATE,
    time TEXT,
    duration INTEGER,
    recurrence TEXT,
    status TEXT,
    zoom_link TEXT,
    notes TEXT,
    color TEXT
);

CREATE TABLE public.session_students (
    session_id TEXT REFERENCES public.sessions(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    PRIMARY KEY (session_id, student_id)
);

CREATE TABLE public.attendance (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES public.sessions(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    status TEXT,
    notes TEXT,
    marked_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.payments (
    id TEXT PRIMARY KEY,
    family_id TEXT REFERENCES public.families(id) ON DELETE CASCADE,
    month TEXT,
    amount INTEGER,
    status TEXT,
    paid_date DATE,
    method TEXT
);

CREATE TABLE public.expenses (
    id TEXT PRIMARY KEY,
    description TEXT,
    amount INTEGER,
    date DATE
);

CREATE TABLE public.notifications (
    id TEXT PRIMARY KEY,
    title TEXT,
    body TEXT,
    time TEXT,
    is_read BOOLEAN DEFAULT false,
    type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.evaluations (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    course_type TEXT,
    month TEXT,
    recitation_score INTEGER,
    memorization_score INTEGER,
    tajweed_score INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 2. User Profiles (Linked to UI roles)
-- Note: Authentication happens via Supabase Auth, but this stores their role mappings
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
    ref_id TEXT, -- e.g., FAM-001, TCH-0001, etc.
    avatar TEXT
);

-- Note: The admin role should probably have RLS policies set up, but for the sake of 
-- the exact same UI working over the network immediately, we enable public access policies or bypass RLS for now.
-- In a real production situation, strict Row Level Security must be enabled.

-- 3. Enable RLS and Create Policies
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- For this migration step, to match the frontend functionality without complex 
-- auth token role injection and ensuring rapid deployment, we allow all authenticated users to read.
-- Admins have full access. Teachers have scoped read/write, etc.

-- VERY PERMISSIVE POLICIES FOR DEMO / MIGRATION (Modify before production)
CREATE POLICY "Allow all select for authenticated users" ON public.families FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all update for authenticated users" ON public.families FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all select for authenticated users" ON public.students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all update for authenticated users" ON public.students FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all select for authenticated users" ON public.teachers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all update for authenticated users" ON public.teachers FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all select for authenticated users" ON public.sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all update for authenticated users" ON public.sessions FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all select for authenticated users" ON public.session_students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all update for authenticated users" ON public.session_students FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all select for authenticated users" ON public.attendance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all update for authenticated users" ON public.attendance FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all select for authenticated users" ON public.payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all update for authenticated users" ON public.payments FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all select for authenticated users" ON public.notifications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all update for authenticated users" ON public.notifications FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all select for authenticated users" ON public.user_profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all update for authenticated users" ON public.user_profiles FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all select for authenticated users" ON public.evaluations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all update for authenticated users" ON public.evaluations FOR ALL USING (auth.role() = 'authenticated');

-- ========================================================================================
-- 4. Seed Data Function (Optional logic in JS side or SQL)
-- For the UI to show immediately, data.js will handle the data sync or we seed here.
-- Instead of doing a large seed in SQL, we can convert your JS SEED data to Supabase 
-- calls on first login if tables are empty.
-- ========================================================================================
