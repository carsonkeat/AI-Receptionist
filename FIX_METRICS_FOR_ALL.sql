-- ============================================================================
-- Fix Metrics Function to Work for All Users (Temporary)
-- ============================================================================
-- This updates the metrics function to return all calls regardless of user
-- ============================================================================

-- Update get_user_metrics to return all calls (temporary fix)
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
  -- Removed the user_id filter temporarily
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

