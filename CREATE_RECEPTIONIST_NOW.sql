-- ============================================================================
-- Create Receptionist with Your Profile ID
-- ============================================================================

-- Create the receptionist record linked to your profile and VAPI Assistant
INSERT INTO receptionists (
  user_id, 
  name, 
  phone_number, 
  vapi_assistant_id, 
  status
)
VALUES (
  '5bc705d3-38a0-4667-a55b-37d04c971789',
  'Trusted KC Receptionist',
  '+18163306811',
  '84959bb6-0f25-4ee5-91e2-d93506440967',
  'active'
);

-- Verify it was created successfully
SELECT id, name, phone_number, vapi_assistant_id, status, created_at
FROM receptionists
WHERE vapi_assistant_id = '84959bb6-0f25-4ee5-91e2-d93506440967';

