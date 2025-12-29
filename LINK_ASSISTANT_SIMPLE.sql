-- ============================================================================
-- Step-by-Step: Link VAPI Assistant to Receptionist
-- ============================================================================

-- STEP 1: See all your receptionists (find the one you want to use)
SELECT id, name, phone_number, vapi_assistant_id, status, created_at
FROM receptionists
ORDER BY created_at DESC;

-- STEP 2: Copy the "id" (UUID) from the receptionist you want to link
-- Then run the UPDATE query below, replacing THE_UUID_HERE with the actual UUID

-- STEP 3: Link the Assistant ID (replace THE_UUID_HERE with actual UUID from Step 1)
-- Example: WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
UPDATE receptionists 
SET 
  phone_number = '+18163306811',
  vapi_assistant_id = '84959bb6-0f25-4ee5-91e2-d93506440967'
WHERE id = 'THE_UUID_HERE';

-- STEP 4: Verify it worked (should show your receptionist with the assistant ID)
SELECT id, name, phone_number, vapi_assistant_id, status 
FROM receptionists 
WHERE vapi_assistant_id = '84959bb6-0f25-4ee5-91e2-d93506440967';

