-- Migration: Add missing GPA and internship_period columns to students table
-- Reason: Frontend expects these fields (profile page, register, applicant details) but they were never persisted.
--         registerUser() and updateStudentProfile() silently dropped the values; applicants query never selected them.

-- Add columns idempotently; gpa as numeric(3,2) with check 0.00-4.00, internship_period as text
alter table public.students
  add column if not exists gpa numeric(3,2) check (gpa is null or (gpa >= 0 and gpa <= 4)),
  add column if not exists internship_period text;

-- Backfill safety: no data migration needed; existing rows keep NULL which frontend already handles as "" / fallback.

-- Optional: index for company filtering if GPA ever becomes a search filter (not required now)
-- create index if not exists idx_students_gpa on public.students (gpa);
-- create index if not exists idx_students_internship_period on public.students (internship_period);

comment on column public.students.gpa is 'Cumulative GPA 0.00-4.00, used in company applicant view';
comment on column public.students.internship_period is 'Preferred internship period e.g. มิ.ย. - ส.ค. 2568';

-- Verify
-- select column_name, data_type from information_schema.columns where table_name='students' and column_name in ('gpa','internship_period');
