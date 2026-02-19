-- =========================================
-- PLACEMENT SESSIONS TABLE
-- Tracks placement training sessions separately from regular attendance
-- =========================================

CREATE TABLE IF NOT EXISTS placement_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'attended', 'missed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE placement_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own placement sessions"
  ON placement_sessions FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own placement sessions"
  ON placement_sessions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own placement sessions"
  ON placement_sessions FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own placement sessions"
  ON placement_sessions FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_placement_sessions_user_id ON placement_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_placement_sessions_date ON placement_sessions(date);
