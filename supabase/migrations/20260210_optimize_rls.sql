-- Optimizing RLS policies to use (select auth.uid()) for better performance

-- =========================================
-- SUBJECTS Policies
-- =========================================
DROP POLICY IF EXISTS "Users can view their own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can create their own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can update their own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can delete their own subjects" ON subjects;

CREATE POLICY "Users can view their own subjects"
  ON subjects FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own subjects"
  ON subjects FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own subjects"
  ON subjects FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own subjects"
  ON subjects FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =========================================
-- TIMETABLE Policies
-- =========================================
DROP POLICY IF EXISTS "Users can view timetable for their subjects" ON timetable;
DROP POLICY IF EXISTS "Users can create timetable for their subjects" ON timetable;
DROP POLICY IF EXISTS "Users can update timetable for their subjects" ON timetable;
DROP POLICY IF EXISTS "Users can delete timetable for their subjects" ON timetable;

CREATE POLICY "Users can view timetable for their subjects"
  ON timetable FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM subjects WHERE subjects.id = timetable.subject_id AND subjects.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can create timetable for their subjects"
  ON timetable FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM subjects WHERE subjects.id = timetable.subject_id AND subjects.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can update timetable for their subjects"
  ON timetable FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM subjects WHERE subjects.id = timetable.subject_id AND subjects.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can delete timetable for their subjects"
  ON timetable FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM subjects WHERE subjects.id = timetable.subject_id AND subjects.user_id = (select auth.uid())
  ));

-- =========================================
-- ATTENDANCE LOGS Policies
-- =========================================
DROP POLICY IF EXISTS "Users can view their own attendance logs" ON attendance_logs;
DROP POLICY IF EXISTS "Users can create their own attendance logs" ON attendance_logs;
DROP POLICY IF EXISTS "Users can update their own attendance logs" ON attendance_logs;
DROP POLICY IF EXISTS "Users can delete their own attendance logs" ON attendance_logs;

CREATE POLICY "Users can view their own attendance logs"
  ON attendance_logs FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own attendance logs"
  ON attendance_logs FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own attendance logs"
  ON attendance_logs FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own attendance logs"
  ON attendance_logs FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =========================================
-- HOLIDAYS Policies
-- =========================================
-- Create table if it doesn't exist (fixes 42P01 error)
CREATE TABLE IF NOT EXISTS holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable RLS (idempotent)
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own holidays" ON holidays;
DROP POLICY IF EXISTS "Users can create their own holidays" ON holidays;
DROP POLICY IF EXISTS "Users can update their own holidays" ON holidays;
DROP POLICY IF EXISTS "Users can delete their own holidays" ON holidays;

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
