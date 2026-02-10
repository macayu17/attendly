-- =========================================
-- ATTENDLY ELITE - DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- =========================================

-- Enable UUID extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- SUBJECTS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT, -- e.g., CS101
  color_code TEXT DEFAULT '#3b82f6',
  min_attendance_req INTEGER DEFAULT 75 CHECK (min_attendance_req >= 50 AND min_attendance_req <= 100),
  credits INTEGER DEFAULT 3 CHECK (credits >= 1 AND credits <= 6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- TIMETABLE TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS timetable (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 (Sun) to 6 (Sat)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

-- =========================================
-- ATTENDANCE LOGS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'cancelled')),
  marked_at DATE DEFAULT CURRENT_DATE,
  session_number INTEGER DEFAULT 1, -- For subjects with multiple classes per day (1st, 2nd, 3rd lecture)
  UNIQUE(subject_id, marked_at, session_number) -- Now allows multiple entries per day, but one per session
);

-- =========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_timetable_subject_id ON timetable(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_id ON attendance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_subject_id ON attendance_logs(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_marked_at ON attendance_logs(marked_at);
-- =========================================
-- HOLIDAYS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- HOLIDAYS Policies
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own holidays"
  ON holidays FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own holidays"
  ON holidays FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own holidays"
  ON holidays FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own holidays"
  ON holidays FOR DELETE
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_holidays_user_id ON holidays(user_id);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
