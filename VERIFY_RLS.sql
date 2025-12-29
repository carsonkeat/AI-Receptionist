-- ============================================================================
-- Verify RLS Policies for Profiles Table
-- ============================================================================
-- Run this in Supabase SQL Editor to check if RLS policies are set up correctly
-- ============================================================================

-- 1. Check if RLS is enabled on profiles table
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- Expected result: rowsecurity should be TRUE (or 't')

-- ============================================================================

-- 2. List all RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname as "Policy Name",
  permissive,
  roles,
  cmd as "Command",  -- SELECT, INSERT, UPDATE, DELETE, ALL
  qual as "Using Expression",  -- The WHERE clause (USING)
  with_check as "With Check Expression"  -- The WHERE clause (WITH CHECK)
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY cmd, policyname;

-- Expected policies:
-- - "Users can view own profile" (SELECT)
-- - "Users can update own profile" (UPDATE)  <-- THIS IS CRITICAL

-- ============================================================================

-- 3. Check the UPDATE policy specifically
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
  AND cmd = 'UPDATE';

-- Expected:
-- - policyname: "Users can update own profile"
-- - qual (USING): "auth.uid() = id"
-- - with_check: should be NULL or "auth.uid() = id"

-- ============================================================================

-- 4. Test if you can read your own profile (should return your profile)
SELECT id, email, vapi_assistant_id, created_at
FROM profiles
WHERE id = auth.uid();

-- If this returns your profile, SELECT policy is working

-- ============================================================================

-- 5. Test if you can update your own profile (run this carefully!)
-- First, check your current vapi_assistant_id:
SELECT id, email, vapi_assistant_id
FROM profiles
WHERE id = auth.uid();

-- Then try updating (replace 'TEST_ID' with a test assistant ID):
-- UPDATE profiles
-- SET vapi_assistant_id = 'TEST_ID'
-- WHERE id = auth.uid();

-- If this works without error, UPDATE policy is working
-- (Don't run this unless you want to test - it will change your data!)

-- ============================================================================

-- 6. Check if you can see other users' profiles (should return 0 rows)
SELECT COUNT(*) as "Other Users Visible"
FROM profiles
WHERE id != auth.uid();

-- If this returns 0, RLS is working correctly (you can only see your own)

-- ============================================================================

-- 7. View the full policy definition (human-readable)
SELECT 
  p.policyname,
  p.cmd,
  pg_get_expr(p.qual, p.relid) as "Using Expression",
  pg_get_expr(p.with_check, p.relid) as "With Check Expression"
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'profiles'
  AND p.polcmd = 'u';  -- 'u' = UPDATE

-- ============================================================================
-- IF POLICIES ARE MISSING OR INCORRECT:
-- ============================================================================

-- If "Users can update own profile" policy doesn't exist, create it:
-- 
-- DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
-- CREATE POLICY "Users can update own profile"
--   ON profiles FOR UPDATE
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);
--
-- This ensures:
-- - Users can ONLY update their own profile (USING clause)
-- - Users can ONLY set values for their own profile (WITH CHECK clause)
-- - This includes updating the vapi_assistant_id field

