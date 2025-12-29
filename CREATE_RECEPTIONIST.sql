-- ============================================================================
-- Create Receptionist and Link VAPI Assistant
-- ============================================================================

-- STEP 1: Find your user/profile ID
-- Replace 'your-email@example.com' with your actual email address
SELECT id, email, account_id
FROM profiles
WHERE email = 'your-email@example.com';

-- STEP 2: Create a receptionist with VAPI Assistant linked
-- Replace 'YOUR_PROFILE_ID_HERE' with the id from Step 1
-- The id is a UUID that looks like: abc12345-def6-7890-abcd-ef1234567890
INSERT INTO receptionists (
  user_id, 
  name, 
  phone_number, 
  vapi_assistant_id, 
  status
)
VALUES (
  'YOUR_PROFILE_ID_HERE',  -- Replace with your profile ID from Step 1
  'Trusted KC Receptionist',
  '+18163306811',
  '84959bb6-0f25-4ee5-91e2-d93506440967',
  'active'
);

-- STEP 3: Verify it was created
SELECT id, name, phone_number, vapi_assistant_id, status, created_at
FROM receptionists
WHERE vapi_assistant_id = '84959bb6-0f25-4ee5-91e2-d93506440967';

