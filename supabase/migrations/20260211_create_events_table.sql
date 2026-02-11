
-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  event_type TEXT CHECK (event_type IN ('exam', 'event', 'placement', 'other')) DEFAULT 'event',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- create policies
CREATE POLICY "Users can view their own events"
  ON events FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own events"
  ON events FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own events"
  ON events FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own events"
  ON events FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);
