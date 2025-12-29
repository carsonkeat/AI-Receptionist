-- ============================================================================
-- Complete Setup: Check Database and Create What's Needed
-- ============================================================================

-- STEP 1: Check what's in your database
SELECT 'Profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Receptionists' as table_name, COUNT(*) as count FROM receptionists
UNION ALL
SELECT 'Calls' as table_name, COUNT(*) as count FROM calls;

-- STEP 2: See all profiles (if any exist)
SELECT id, email, created_at 
FROM profiles 
ORDER BY created_at DESC
LIMIT 10;

-- STEP 3: Check your auth users (these are created when you sign up)
-- This will show you who is authenticated
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- If no profile exists, you may need to:
-- 1. Sign up/login through your app first (this creates auth.users and profiles)
-- OR
-- 2. Create a profile manually using the auth.users ID
-- ============================================================================

-- STEP 4: If you have auth.users but no profile, create profile:
-- (Replace AUTH_USER_ID with an id from Step 3)
/*
INSERT INTO profiles (id, email)
SELECT id, email 
FROM auth.users 
WHERE id = 'AUTH_USER_ID'
ON CONFLICT (id) DO NOTHING;
*/

-- STEP 5: Then create receptionist (replace PROFILE_ID with profile id)
/*
INSERT INTO receptionists (
  user_id, 
  name, 
  phone_number, 
  vapi_assistant_id, 
  status
)
VALUES (
  'PROFILE_ID',
  'Trusted KC Receptionist',
  '+18163306811',
  '84959bb6-0f25-4ee5-91e2-d93506440967',
  'active'
);
*/

