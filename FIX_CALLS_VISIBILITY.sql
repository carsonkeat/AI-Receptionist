-- ============================================================================
-- Quick Fix: Make All Calls Visible to All Users
-- ============================================================================
-- Run this to immediately fix the visibility issue
-- ============================================================================

-- Allow all authenticated users to view all calls
DROP POLICY IF EXISTS "Users can view own calls" ON calls;
CREATE POLICY "All users can view all calls"
  ON calls FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow all authenticated users to view all receptionists
DROP POLICY IF EXISTS "Users can view own receptionists" ON receptionists;
CREATE POLICY "All users can view all receptionists"
  ON receptionists FOR SELECT
  USING (auth.role() = 'authenticated');

-- Verify it works (you should see rows now)
SELECT COUNT(*) as total_calls FROM calls;
SELECT COUNT(*) as total_receptionists FROM receptionists;

