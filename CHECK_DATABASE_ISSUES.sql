-- ============================================================================
-- Check for Common Database Issues
-- ============================================================================

-- 1. Verify receptionist exists and is linked
SELECT id, name, vapi_assistant_id, status 
FROM receptionists 
WHERE vapi_assistant_id = '84959bb6-0f25-4ee5-91e2-d93506440967';

-- Expected: Should return 1 row
-- If 0 rows, that's why it's failing!

-- 2. Check if calls table allows 'Unknown' as caller_number
-- (The schema requires text NOT NULL, so 'Unknown' should be fine)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'calls'
ORDER BY ordinal_position;

-- 3. Try a manual insert to see what error we get
-- (This will help identify the exact issue)
-- Replace RECEPTIONIST_ID with the actual UUID from query 1
/*
INSERT INTO calls (
  receptionist_id,
  caller_number,
  timestamp,
  duration_seconds,
  minutes_billed,
  cost,
  label
)
VALUES (
  'RECEPTIONIST_ID',  -- Replace with actual receptionist UUID
  'Unknown',
  NOW(),
  60,
  1.00,
  0.10,
  'other'
);
*/

