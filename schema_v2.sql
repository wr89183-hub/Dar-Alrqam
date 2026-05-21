-- ========================================================================================
-- ACADEMY MANAGEMENT SYSTEM - SCHEMA v2 UPGRADE
-- ========================================================================================

-- 1. Alter user_profiles to support Registration requirements
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';

-- 2. Create Teacher Ratings table
CREATE TABLE IF NOT EXISTS public.teacher_ratings (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES public.sessions(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    teaching_style INTEGER CHECK (teaching_style BETWEEN 1 AND 5),
    clarity INTEGER CHECK (clarity BETWEEN 1 AND 5),
    comfort INTEGER CHECK (comfort BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Withdrawals table for Salary Management
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'rejected')),
    request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_date TIMESTAMP WITH TIME ZONE
);

-- 4. Enforce RLS on new tables
ALTER TABLE public.teacher_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select for authenticated users" ON public.teacher_ratings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all insert for authenticated users" ON public.teacher_ratings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow all update for authenticated users" ON public.teacher_ratings FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all select for authenticated users" ON public.withdrawals FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all insert for authenticated users" ON public.withdrawals FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow all update for authenticated users" ON public.withdrawals FOR UPDATE USING (auth.role() = 'authenticated');

-- IMPORTANT: RLS Note.
-- For true frontend shielding, policies here can be made stricter. 
-- However, we preserve public authenticated reads to respect the local JS hydrations and frontend privacy logic pattern.
