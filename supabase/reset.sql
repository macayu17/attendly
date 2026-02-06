    -- =========================================
    -- ATTENDLY ELITE - RESET DATABASE
    -- Run this FIRST if you're having schema issues
    -- =========================================

    -- Drop existing tables (in correct order due to foreign keys)
    DROP TABLE IF EXISTS attendance_logs CASCADE;
    DROP TABLE IF EXISTS timetable CASCADE;
    DROP TABLE IF EXISTS subjects CASCADE;

    -- Drop policies if they exist (ignore errors)
    -- These will be recreated by schema.sql

    -- =========================================
    -- Now run schema.sql after this completes
    -- =========================================
