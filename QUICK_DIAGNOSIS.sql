-- ============================================================================
-- Quick Diagnosis - Run These Queries
-- ============================================================================

-- 1. Check if receptionist exists and is linked correctly
SELECT 
  id, 
  name, 
  phone_number, 
  vapi_assistant_id, 
  status,
  created_at
FROM receptionists 
WHERE vapi_assistant_id = '84959bb6-0f25-4ee5-91e2-d93506440967';

-- Expected: Should return 1 row
-- If 0 rows: Receptionist not created/linked - that's why you get 404 errors!

-- 2. Check if any calls have been saved (even failed attempts might leave traces)
SELECT 
  COUNT(*) as total_calls,
  COUNT(CASE WHEN metadata->>'vapi_assistant_id' = '84959bb6-0f25-4ee5-91e2-d93506440967' THEN 1 END) as calls_for_this_assistant
FROM calls;

-- 3. See the most recent calls (if any)
SELECT 
  id,
  caller_number,
  timestamp,
  duration_seconds,
  cost,
  metadata->>'vapi_call_id' as vapi_call_id,
  metadata->>'vapi_assistant_id' as assistant_id,
  created_at
FROM calls
ORDER BY created_at DESC
LIMIT 5;

-- 4. If receptionist doesn't exist, create it:
/*
INSERT INTO receptionists (
  user_id, 
  name, 
  phone_number, 
  vapi_assistant_id, 
  status
)
VALUES (
  '5bc705d3-38a0-4667-a55b-37d04c971789',
  'Trusted KC Receptionist',
  '+18163306811',
  '84959bb6-0f25-4ee5-91e2-d93506440967',
  'active'
);
*/

