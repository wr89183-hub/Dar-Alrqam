-- ========================================================================================
-- ACADEMY MANAGEMENT SYSTEM - DEMO DATA SEEDING SCRIPT
-- ========================================================================================

-- IMPORTANT: This script inserts directly into auth.users. 
-- Make sure the Pgcrypto extension is active (it should be by default in Supabase).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Generate UUIDs for our demo users
-- Admin: e4b2c019-38b8-4c63-8f0a-dc73966fb9cf
-- Teacher1: dcb8d0b2-4d2a-4121-8785-35cf97fd2b41
-- Teacher2: a9dbed6e-7117-48f8-b3d9-48ed16cb5e98
-- Student1: 67b678b8-f86a-4952-b132-7bed9d3e8ad3
-- Student2: 3d508eab-829d-472e-8aae-8bf88ce2b512
-- Student3: c9329759-4d6d-4959-b1d5-2a2cd1c784ec
-- Parent1:  4c30c7ae-fecd-47bc-8a43-69019ab76bc2
-- Parent2:  1b1e95c4-722a-4cfb-b9f1-7aa488f28689

-- 1. Insert into auth.users
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'e4b2c019-38b8-4c63-8f0a-dc73966fb9cf', 'authenticated', 'authenticated', 'admin@daralarqam.com',   crypt('admin123', gen_salt('bf')), now(), NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'dcb8d0b2-4d2a-4121-8785-35cf97fd2b41', 'authenticated', 'authenticated', 'teacher@daralarqam.com', crypt('teacher123', gen_salt('bf')), now(), NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a9dbed6e-7117-48f8-b3d9-48ed16cb5e98', 'authenticated', 'authenticated', 'teacher2@daralarqam.com',crypt('teacher123', gen_salt('bf')), now(), NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '67b678b8-f86a-4952-b132-7bed9d3e8ad3', 'authenticated', 'authenticated', 'student@daralarqam.com', crypt('student123', gen_salt('bf')), now(), NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '3d508eab-829d-472e-8aae-8bf88ce2b512', 'authenticated', 'authenticated', 'student2@daralarqam.com',crypt('student123', gen_salt('bf')), now(), NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'c9329759-4d6d-4959-b1d5-2a2cd1c784ec', 'authenticated', 'authenticated', 'student3@daralarqam.com',crypt('student123', gen_salt('bf')), now(), NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '4c30c7ae-fecd-47bc-8a43-69019ab76bc2', 'authenticated', 'authenticated', 'parent@daralarqam.com',  crypt('parent123', gen_salt('bf')), now(), NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1b1e95c4-722a-4cfb-b9f1-7aa488f28689', 'authenticated', 'authenticated', 'parent2@daralarqam.com', crypt('parent123', gen_salt('bf')), now(), NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Insert auth.identities
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES
  ('e4b2c019-38b8-4c63-8f0a-dc73966fb9cf', 'e4b2c019-38b8-4c63-8f0a-dc73966fb9cf', format('{"sub":"%s","email":"%s"}', 'e4b2c019-38b8-4c63-8f0a-dc73966fb9cf', 'admin@daralarqam.com')::jsonb, 'email', 'admin@daralarqam.com', now(), now(), now()),
  ('dcb8d0b2-4d2a-4121-8785-35cf97fd2b41', 'dcb8d0b2-4d2a-4121-8785-35cf97fd2b41', format('{"sub":"%s","email":"%s"}', 'dcb8d0b2-4d2a-4121-8785-35cf97fd2b41', 'teacher@daralarqam.com')::jsonb, 'email', 'teacher@daralarqam.com', now(), now(), now()),
  ('a9dbed6e-7117-48f8-b3d9-48ed16cb5e98', 'a9dbed6e-7117-48f8-b3d9-48ed16cb5e98', format('{"sub":"%s","email":"%s"}', 'a9dbed6e-7117-48f8-b3d9-48ed16cb5e98', 'teacher2@daralarqam.com')::jsonb, 'email', 'teacher2@daralarqam.com', now(), now(), now()),
  ('67b678b8-f86a-4952-b132-7bed9d3e8ad3', '67b678b8-f86a-4952-b132-7bed9d3e8ad3', format('{"sub":"%s","email":"%s"}', '67b678b8-f86a-4952-b132-7bed9d3e8ad3', 'student@daralarqam.com')::jsonb, 'email', 'student@daralarqam.com', now(), now(), now()),
  ('3d508eab-829d-472e-8aae-8bf88ce2b512', '3d508eab-829d-472e-8aae-8bf88ce2b512', format('{"sub":"%s","email":"%s"}', '3d508eab-829d-472e-8aae-8bf88ce2b512', 'student2@daralarqam.com')::jsonb, 'email', 'student2@daralarqam.com', now(), now(), now()),
  ('c9329759-4d6d-4959-b1d5-2a2cd1c784ec', 'c9329759-4d6d-4959-b1d5-2a2cd1c784ec', format('{"sub":"%s","email":"%s"}', 'c9329759-4d6d-4959-b1d5-2a2cd1c784ec', 'student3@daralarqam.com')::jsonb, 'email', 'student3@daralarqam.com', now(), now(), now()),
  ('4c30c7ae-fecd-47bc-8a43-69019ab76bc2', '4c30c7ae-fecd-47bc-8a43-69019ab76bc2', format('{"sub":"%s","email":"%s"}', '4c30c7ae-fecd-47bc-8a43-69019ab76bc2', 'parent@daralarqam.com')::jsonb, 'email', 'parent@daralarqam.com', now(), now(), now()),
  ('1b1e95c4-722a-4cfb-b9f1-7aa488f28689', '1b1e95c4-722a-4cfb-b9f1-7aa488f28689', format('{"sub":"%s","email":"%s"}', '1b1e95c4-722a-4cfb-b9f1-7aa488f28689', 'parent2@daralarqam.com')::jsonb, 'email', 'parent2@daralarqam.com', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Base Records (Families, Teachers, Students)
INSERT INTO public.families (id, name, email, phone, plan, monthly_fee, status, join_date)
VALUES
  ('FAM-001', 'Al-Farsi Family', 'parent@daralarqam.com', '+971-50-123-4567', 'standard', 280, 'active', '2024-09-01'),
  ('FAM-002', 'Rahman Family',   'parent2@daralarqam.com','+44-7700-900123',  'premium',  420, 'active', '2024-08-15')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.teachers (id, name, email, specialization, status, session_rate, sessions, avatar, join_date, bio)
VALUES
  ('TCH-0001', 'Ustadh Yusuf Hassan', 'teacher@daralarqam.com',  ARRAY['Quran','Tajweed'],  'active', 25, 48, 'Y', '2024-01-15', 'Hafiz with Ijazah in Qirat Asim.'),
  ('TCH-0002', 'Ustadha Fatima Ali',  'teacher2@daralarqam.com', ARRAY['Arabic','Grammar'],'active', 22, 36, 'F', '2024-02-01', 'MA in Arabic Literature.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.students (id, name, family_id, age, grade, status, courses, join_date, avatar)
VALUES
  ('STU-0001', 'Ibrahim Al-Farsi', 'FAM-001', 12, '6th', 'active', ARRAY['Quran','Arabic'], '2024-09-01', 'I'),
  ('STU-0002', 'Zahra Al-Farsi',   'FAM-001',  9, '4th', 'active', ARRAY['Quran'],          '2024-09-01', 'Z'),
  ('STU-0003', 'Aisha Rahman',     'FAM-002', 14, '8th', 'active', ARRAY['Quran','Fiqh'],   '2024-08-15', 'A')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert User Profiles (Linking Auth with Base Records)
INSERT INTO public.user_profiles (id, email, name, role, ref_id, avatar)
VALUES
  ('e4b2c019-38b8-4c63-8f0a-dc73966fb9cf', 'admin@daralarqam.com',   'Waleed Ramadan',      'admin',   NULL,       'W'),
  ('dcb8d0b2-4d2a-4121-8785-35cf97fd2b41', 'teacher@daralarqam.com', 'Ustadh Yusuf Hassan', 'teacher', 'TCH-0001', 'Y'),
  ('a9dbed6e-7117-48f8-b3d9-48ed16cb5e98', 'teacher2@daralarqam.com','Ustadha Fatima Ali',  'teacher', 'TCH-0002', 'F'),
  ('67b678b8-f86a-4952-b132-7bed9d3e8ad3', 'student@daralarqam.com', 'Ibrahim Al-Farsi',    'student', 'STU-0001', 'I'),
  ('3d508eab-829d-472e-8aae-8bf88ce2b512', 'student2@daralarqam.com','Zahra Al-Farsi',      'student', 'STU-0002', 'Z'),
  ('c9329759-4d6d-4959-b1d5-2a2cd1c784ec', 'student3@daralarqam.com','Aisha Rahman',        'student', 'STU-0003', 'A'),
  ('4c30c7ae-fecd-47bc-8a43-69019ab76bc2', 'parent@daralarqam.com',  'Abdullah Al-Farsi',   'parent',  'FAM-001',  'A'),
  ('1b1e95c4-722a-4cfb-b9f1-7aa488f28689', 'parent2@daralarqam.com', 'Rahman Parent',       'parent',  'FAM-002',  'R')
ON CONFLICT (id) DO UPDATE SET ref_id = EXCLUDED.ref_id, role = EXCLUDED.role;

-- 4. Insert some Sessions to verify dashboard counts
INSERT INTO public.sessions (id, course_type, teacher_id, date, time, duration, recurrence, status, zoom_link, notes, color)
VALUES
  ('SES-0001', 'Quran',  'TCH-0001', (now() at time zone 'utc')::date, '10:00', 45, 'weekly', 'completed', 'https://zoom.us/j/12345', 'Good session', 'quran'),
  ('SES-0002', 'Arabic', 'TCH-0002', (now() at time zone 'utc')::date, '14:00', 60, 'weekly', 'upcoming',  'https://zoom.us/j/12346', '', 'arabic')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.session_students (session_id, student_id)
VALUES
  ('SES-0001', 'STU-0001'),
  ('SES-0002', 'STU-0002'),
  ('SES-0002', 'STU-0003')
ON CONFLICT DO NOTHING;

-- 5. Insert sample payments to populate Dashboard Monthly Revenue stat
INSERT INTO public.payments (id, family_id, month, amount, status, paid_date, method)
VALUES
  ('PAY-0001', 'FAM-001', to_char(now(), 'YYYY-MM'), 280, 'paid', (now() at time zone 'utc')::date, 'stripe'),
  ('PAY-0002', 'FAM-002', to_char(now(), 'YYYY-MM'), 420, 'pending', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert sample attendance
INSERT INTO public.attendance (id, session_id, student_id, status, notes, marked_at)
VALUES
  ('ATT-0001', 'SES-0001', 'STU-0001', 'present', '', now())
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Notifications to verify Recent Activity
INSERT INTO public.notifications (id, title, body, time, is_read, type, created_at)
VALUES
  ('NOT-0001', 'Welcome to Supabase!', 'Your data layer migration is complete and seeded.', '1m ago', false, 'announcement', now())
ON CONFLICT (id) DO NOTHING;
