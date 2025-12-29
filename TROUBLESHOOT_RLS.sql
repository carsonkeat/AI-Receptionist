-- ============================================================================
-- Troubleshooting: Make Calls Visible to All Users (Temporary)
-- ============================================================================
-- This will temporarily allow all authenticated users to see all calls
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- First, let's check what we have in the database
SELECT 'Calls count:' as info, COUNT(*) as count FROM calls;
SELECT 'Receptionists count:' as info, COUNT(*) as count FROM receptionists;
SELECT 'Profiles count:' as info, COUNT(*) as count FROM profiles;

-- Show all calls
SELECT id, receptionist_id, caller_number, timestamp, cost, minutes_billed
FROM calls
ORDER BY timestamp DESC
LIMIT 10;

-- Show all receptionists with their user_ids
SELECT r.id, r.user_id, r.name, r.vapi_assistant_id, p.email
FROM receptionists r
LEFT JOIN profiles p ON p.id = r.user_id;

-- ============================================================================
-- TEMPORARY FIX: Allow all authenticated users to see all calls
-- ============================================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own calls" ON calls;

-- Create a new policy that allows all authenticated users to see all calls
CREATE POLICY "All users can view all calls"
  ON calls FOR SELECT
  USING (auth.role() = 'authenticated');

-- Also allow all authenticated users to see all receptionists (for debugging)
DROP POLICY IF EXISTS "Users can view own receptionists" ON receptionists;
CREATE POLICY "All users can view all receptionists"
  ON receptionists FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- Check if calls exist but aren't linked properly
-- ============================================================================

-- Check calls without valid receptionists
SELECT 
  c.id as call_id,
  c.receptionist_id,
  c.caller_number,
  c.timestamp,
  CASE WHEN r.id IS NULL THEN 'ORPHANED (no receptionist)' ELSE 'OK' END as status
FROM calls c
LEFT JOIN receptionists r ON r.id = c.receptionist_id;

-- Check receptionists without valid users
SELECT 
  r.id as receptionist_id,
  r.user_id,
  r.vapi_assistant_id,
  CASE WHEN p.id IS NULL THEN 'ORPHANED (no user)' ELSE 'OK' END as status
FROM receptionists r
LEFT JOIN profiles p ON p.id = r.user_id;

