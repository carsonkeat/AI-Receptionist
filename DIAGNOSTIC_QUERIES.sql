-- ============================================================================
-- Diagnostic Queries - Run these to troubleshoot
-- ============================================================================

-- 1. Check if you're authenticated and your user ID
SELECT 
  'Current User' as check_type,
  auth.uid() as user_id,
  auth.role() as role;

-- 2. Check all calls in database
SELECT 
  'All Calls' as check_type,
  COUNT(*) as count,
  SUM(cost) as total_cost,
  SUM(minutes_billed) as total_minutes
FROM calls;

-- 3. Check calls with receptionist details
SELECT 
  c.id,
  c.caller_number,
  c.timestamp,
  c.cost,
  c.minutes_billed,
  r.id as receptionist_id,
  r.user_id as receptionist_owner,
  p.email as owner_email
FROM calls c
LEFT JOIN receptionists r ON r.id = c.receptionist_id
LEFT JOIN profiles p ON p.id = r.user_id
ORDER BY c.timestamp DESC
LIMIT 20;

-- 4. Check if calls are blocked by RLS
-- This will show what you can actually see
SELECT 
  'Visible Calls' as check_type,
  COUNT(*) as count
FROM calls;

-- 5. Check receptionists
SELECT 
  r.id,
  r.name,
  r.user_id,
  r.vapi_assistant_id,
  p.email,
  COUNT(c.id) as call_count
FROM receptionists r
LEFT JOIN profiles p ON p.id = r.user_id
LEFT JOIN calls c ON c.receptionist_id = r.id
GROUP BY r.id, r.name, r.user_id, r.vapi_assistant_id, p.email;

-- 6. Test the metrics function
SELECT * FROM get_user_metrics(auth.uid());

