-- =========================================
-- MIGRATION: Add session_number column
-- Run this to add multi-session support WITHOUT deleting data
-- =========================================

-- Step 1: Add the new column (with default value 1 for existing records)
ALTER TABLE attendance_logs 
ADD COLUMN IF NOT EXISTS session_number INTEGER DEFAULT 1;

-- Step 2: Drop the old unique constraint (subject_id, marked_at)
-- This may fail if the constraint doesn't exist - that's OK
ALTER TABLE attendance_logs 
DROP CONSTRAINT IF EXISTS attendance_logs_subject_id_marked_at_key;

-- Step 3: Add the new unique constraint (subject_id, marked_at, session_number)
ALTER TABLE attendance_logs
ADD CONSTRAINT attendance_logs_subject_id_marked_at_session_number_key 
UNIQUE (subject_id, marked_at, session_number);

-- Done! Existing data is preserved with session_number = 1
