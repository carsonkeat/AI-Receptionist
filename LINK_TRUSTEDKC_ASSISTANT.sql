-- ============================================================================
-- Link TrustedKC Assistant to Your Receptionist
-- ============================================================================

-- STEP 1: Check your current receptionist
SELECT id, name, phone_number, vapi_assistant_id, status, created_at
FROM receptionists
ORDER BY created_at DESC;

-- STEP 2: Update receptionist to link TrustedKC assistant
-- This will link the TrustedKC assistant (84959bb6-0f25-4ee5-91e2-d93506440967)
-- Replace 'YOUR_RECEPTIONIST_ID' with your actual receptionist ID from Step 1

UPDATE receptionists 
SET 
  vapi_assistant_id = '84959bb6-0f25-4ee5-91e2-d93506440967'
WHERE id = 'YOUR_RECEPTIONIST_ID';

-- Or update by name if you know it:
UPDATE receptionists 
SET 
  vapi_assistant_id = '84959bb6-0f25-4ee5-91e2-d93506440967'
WHERE name LIKE '%Trusted%' OR name LIKE '%KC%';

-- STEP 3: Verify the update worked
SELECT id, name, phone_number, vapi_assistant_id, status 
FROM receptionists 
WHERE vapi_assistant_id = '84959bb6-0f25-4ee5-91e2-d93506440967';

-- ============================================================================
-- TrustedKC Assistant Details:
-- ID: 84959bb6-0f25-4ee5-91e2-d93506440967
-- Name: TrustedKC
-- ============================================================================

