-- ============================================================================
-- VAPI Integration - Database Schema Updates
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor to add VAPI support
-- ============================================================================

-- Add VAPI fields to receptionists table
ALTER TABLE receptionists
ADD COLUMN IF NOT EXISTS vapi_assistant_id text,
ADD COLUMN IF NOT EXISTS vapi_phone_number_id text;

-- Add index for faster VAPI assistant ID lookups
CREATE INDEX IF NOT EXISTS idx_receptionists_vapi_assistant_id 
ON receptionists(vapi_assistant_id);

CREATE INDEX IF NOT EXISTS idx_receptionists_vapi_phone_number_id 
ON receptionists(vapi_phone_number_id);

-- Add comment for documentation
COMMENT ON COLUMN receptionists.vapi_assistant_id IS 'VAPI Assistant ID - links to VAPI assistant';
COMMENT ON COLUMN receptionists.vapi_phone_number_id IS 'VAPI Phone Number ID - links to VAPI phone number';

-- ============================================================================
-- Note: The calls table already supports storing VAPI data via the metadata
-- jsonb field. Example structure:
-- {
--   "vapi_call_id": "call_abc123",
--   "vapi_assistant_id": "asst_xyz789",
--   "vapi_phone_number_id": "phone_123",
--   "status": "ended",
--   "ended_reason": "customer-hangup",
--   "recording_url": "https://...",
--   "cost_breakdown": {...}
-- }
-- ============================================================================

