-- INSERT PLACEMENT SESSIONS (FINAL)
-- Using provided User ID: a281e7d1-feb5-41a1-86d5-f938120bd6f8

INSERT INTO placement_sessions (user_id, name, date, start_time, end_time, status)
SELECT 
  'a281e7d1-feb5-41a1-86d5-f938120bd6f8'::uuid,
  name, 
  date::date, 
  start_time::time, 
  end_time::time,
  'pending'
FROM (VALUES 
  -- Wednesday, Feb 25, 2026
  ('Linear & Quadratic Equations', '2026-02-25', '09:30:00', '11:30:00'),
  ('Interview Etiquette',          '2026-02-25', '11:45:00', '13:45:00'),
  ('Problem on Ages',              '2026-02-25', '14:30:00', '16:30:00'),

  -- Thursday, Feb 26, 2026
  ('Averages & Mixtures',          '2026-02-26', '09:30:00', '11:30:00'),
  ('Presentation Skills',          '2026-02-26', '11:45:00', '13:45:00'),
  ('Time, Speed & Distance',       '2026-02-26', '14:30:00', '16:30:00'),

  -- Friday, Feb 27, 2026
  ('Probability',                  '2026-02-27', '09:30:00', '11:30:00'),
  ('Mock PI & GD',                 '2026-02-27', '11:45:00', '13:45:00'),
  ('Direct Sense & Blood Relations', '2026-02-27', '14:30:00', '16:30:00')
) AS t(name, date, start_time, end_time);
