-- ========================================================================================
-- ACADEMY MANAGEMENT SYSTEM - SCHEMA v3 UPGRADE
-- Smart Recurring Schedule System
-- ========================================================================================

-- 1. Create student_schedules table
CREATE TABLE IF NOT EXISTS public.student_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id TEXT REFERENCES public.teachers(id) ON DELETE SET NULL,
    course_type TEXT NOT NULL,                        -- Quran / Arabic / Fiqh
    days_of_week TEXT[] NOT NULL,                     -- e.g. ["Saturday","Tuesday"]
    session_time TIME NOT NULL,                       -- e.g. 09:00
    duration_min INT NOT NULL DEFAULT 60,             -- 30 / 45 / 60
    start_date DATE NOT NULL,                         -- when schedule begins
    status TEXT NOT NULL DEFAULT 'active'             -- active / paused
        CHECK (status IN ('active', 'paused')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create schedule_change_log for auditing
CREATE TABLE IF NOT EXISTS public.schedule_change_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES public.student_schedules(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    change_type TEXT NOT NULL,    -- 'created' | 'updated' | 'paused' | 'resumed' | 'cancelled'
    changed_fields TEXT,          -- JSON string of what changed (e.g. {"days":["Sat","Mon"]})
    changed_by TEXT,              -- email of admin who made the change
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add schedule_id column to sessions to track which schedule generated it
ALTER TABLE public.sessions
    ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES public.student_schedules(id) ON DELETE SET NULL;

-- 4. Enable RLS
ALTER TABLE public.student_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_change_log ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for student_schedules
CREATE POLICY "Allow all for authenticated users on student_schedules select"
    ON public.student_schedules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users on student_schedules insert"
    ON public.student_schedules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users on student_schedules update"
    ON public.student_schedules UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users on student_schedules delete"
    ON public.student_schedules FOR DELETE USING (auth.role() = 'authenticated');

-- 6. RLS Policies for schedule_change_log
CREATE POLICY "Allow all for authenticated users on schedule_change_log select"
    ON public.schedule_change_log FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users on schedule_change_log insert"
    ON public.schedule_change_log FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ========================================================================================
-- NOTES:
-- Run this script in your Supabase SQL editor AFTER schema_v2.sql
-- The sessions table already exists; we just add the schedule_id column.
-- ========================================================================================
