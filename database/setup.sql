-- ============================================================================
-- AI Receptionist App - Database Setup Script
-- ============================================================================
-- This script sets up the complete database schema for the AI Receptionist app.
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create receptionists table
CREATE TABLE IF NOT EXISTS receptionists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'AI Receptionist',
  phone_number text,
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create calls table
CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receptionist_id uuid NOT NULL REFERENCES receptionists(id) ON DELETE CASCADE,
  caller_number text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  duration_seconds integer NOT NULL DEFAULT 0,
  minutes_billed numeric(10, 2) NOT NULL DEFAULT 0,
  cost numeric(10, 4) NOT NULL DEFAULT 0,
  label text NOT NULL DEFAULT 'other' CHECK (label IN ('lead', 'spam', 'appointment', 'other')),
  transcript text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_account_id ON profiles(account_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Receptionists indexes
CREATE INDEX IF NOT EXISTS idx_receptionists_user_id ON receptionists(user_id);
CREATE INDEX IF NOT EXISTS idx_receptionists_status ON receptionists(status);

-- Calls indexes
CREATE INDEX IF NOT EXISTS idx_calls_receptionist_id ON calls(receptionist_id);
CREATE INDEX IF NOT EXISTS idx_calls_timestamp ON calls(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_calls_label ON calls(label);
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(receptionist_id) 
  INCLUDE (timestamp, cost, label);

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE receptionists ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE RLS POLICIES
-- ============================================================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Receptionists policies
DROP POLICY IF EXISTS "Users can view own receptionists" ON receptionists;
CREATE POLICY "Users can view own receptionists"
  ON receptionists FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own receptionists" ON receptionists;
CREATE POLICY "Users can insert own receptionists"
  ON receptionists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own receptionists" ON receptionists;
CREATE POLICY "Users can update own receptionists"
  ON receptionists FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own receptionists" ON receptionists;
CREATE POLICY "Users can delete own receptionists"
  ON receptionists FOR DELETE
  USING (auth.uid() = user_id);

-- Calls policies
DROP POLICY IF EXISTS "Users can view own calls" ON calls;
CREATE POLICY "Users can view own calls"
  ON calls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM receptionists
      WHERE receptionists.id = calls.receptionist_id
      AND receptionists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own calls" ON calls;
CREATE POLICY "Users can insert own calls"
  ON calls FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM receptionists
      WHERE receptionists.id = calls.receptionist_id
      AND receptionists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own calls" ON calls;
CREATE POLICY "Users can update own calls"
  ON calls FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM receptionists
      WHERE receptionists.id = calls.receptionist_id
      AND receptionists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own calls" ON calls;
CREATE POLICY "Users can delete own calls"
  ON calls FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM receptionists
      WHERE receptionists.id = calls.receptionist_id
      AND receptionists.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. CREATE TRIGGER FUNCTIONS
-- ============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. CREATE TRIGGERS
-- ============================================================================

-- Auto-update triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_receptionists_updated_at ON receptionists;
CREATE TRIGGER update_receptionists_updated_at
  BEFORE UPDATE ON receptionists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calls_updated_at ON calls;
CREATE TRIGGER update_calls_updated_at
  BEFORE UPDATE ON calls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 7. CREATE DATABASE FUNCTIONS
-- ============================================================================

-- Function to get user metrics
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
  FROM calls c
  INNER JOIN receptionists r ON r.id = c.receptionist_id
  WHERE r.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get receptionist metrics
CREATE OR REPLACE FUNCTION get_receptionist_metrics(receptionist_uuid uuid)
RETURNS TABLE (
  minutes_used numeric,
  total_cost numeric,
  cost_per_minute numeric,
  calls_handled bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(c.minutes_billed), 0)::numeric as minutes_used,
    COALESCE(SUM(c.cost), 0)::numeric as total_cost,
    CASE 
      WHEN SUM(c.minutes_billed) > 0 
      THEN SUM(c.cost) / SUM(c.minutes_billed)
      ELSE 0
    END::numeric as cost_per_minute,
    COUNT(c.id)::bigint as calls_handled
  FROM calls c
  WHERE c.receptionist_id = receptionist_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Function to get metrics by date range
CREATE OR REPLACE FUNCTION get_user_metrics_by_date_range(
  user_uuid uuid,
  start_date timestamptz,
  end_date timestamptz
)
RETURNS TABLE (
  total_minutes_used numeric,
  total_cost numeric,
  cost_per_minute numeric,
  total_calls bigint
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
    COUNT(c.id)::bigint as total_calls
  FROM calls c
  INNER JOIN receptionists r ON r.id = c.receptionist_id
  WHERE r.user_id = user_uuid
    AND c.timestamp >= start_date
    AND c.timestamp <= end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. OPTIONAL: CREATE VIEWS
-- ============================================================================

-- Optional view for faster dashboard queries
CREATE OR REPLACE VIEW user_call_summary AS
SELECT
  r.user_id,
  COUNT(c.id) as total_calls,
  SUM(c.minutes_billed) as total_minutes,
  SUM(c.cost) as total_cost,
  CASE 
    WHEN SUM(c.minutes_billed) > 0 
    THEN SUM(c.cost) / SUM(c.minutes_billed)
    ELSE 0
  END as cost_per_minute,
  MAX(c.timestamp) as last_call_timestamp
FROM calls c
INNER JOIN receptionists r ON r.id = c.receptionist_id
GROUP BY r.user_id;

-- Grant access with RLS
ALTER VIEW user_call_summary SET (security_invoker = true);

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Your database is now set up with:
-- - All tables (profiles, receptionists, calls)
-- - All indexes for performance
-- - Row Level Security (RLS) enabled
-- - All RLS policies configured
-- - Auto-update triggers for timestamps
-- - Auto-profile creation on user signup
-- - Database functions for metrics
-- - Optional view for faster queries
-- ============================================================================


