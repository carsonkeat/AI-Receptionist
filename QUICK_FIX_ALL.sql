-- ============================================================================
-- QUICK FIX: Make All Calls & Metrics Visible to All Users
-- ============================================================================
-- Run this file in Supabase SQL Editor to fix visibility issues
-- ============================================================================

-- Step 1: Make all calls visible to all authenticated users
DROP POLICY IF EXISTS "Users can view own calls" ON calls;
CREATE POLICY "All users can view all calls"
  ON calls FOR SELECT
  USING (auth.role() = 'authenticated');

-- Step 2: Make all receptionists visible (for debugging)
DROP POLICY IF EXISTS "Users can view own receptionists" ON receptionists;
CREATE POLICY "All users can view all receptionists"
  ON receptionists FOR SELECT
  USING (auth.role() = 'authenticated');

-- Step 3: Update metrics function to return all calls
CREATE OR REPLACE FUNCTION get_user_metrics(user_uuid uuid)
RETURNS TABLE (
  total_minutes_used numeric,
  total_cost numeric,
  cost_per_minute numeric,
  total_calls bigint,
  last_updated timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(c.minutes_billed), 0)::numeric as total_minutes_used,
    COALESCE(SUM(c.cost), 0)::numeric as total_cost,
    CASE 
      WHEN SUM(c.minutes_billed) > 0 
      THEN SUM(c.cost) / SUM(c.minutes_billed)
      ELSE 0
    END::numeric as cost_per_minute,
    COUNT(c.id)::bigint as total_calls,
    MAX(c.updated_at) as last_updated
  FROM calls c;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Verify it worked
SELECT 
  'Fix Applied!' as status,
  (SELECT COUNT(*) FROM calls) as total_calls,
  (SELECT COUNT(*) FROM receptionists) as total_receptionists;

-- Done! Your app should now show all calls and metrics.

