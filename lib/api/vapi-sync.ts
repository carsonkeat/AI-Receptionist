/**
 * VAPI to Supabase sync functions
 * Handles syncing VAPI data to our database
 */

import { createCall, updateCall } from './calls'
import { updateReceptionist } from './receptionists'
import type { VapiCall, VapiAssistant, VapiWebhookEvent } from './vapi'
import type { CallLabel } from '@/types/database'

/**
 * Convert VAPI call status to our call status
 */
const mapVapiStatusToCallStatus = (
  vapiStatus: string
): 'completed' | 'missed' | 'failed' => {
  if (vapiStatus === 'ended') return 'completed'
  if (vapiStatus === 'queued' || vapiStatus === 'ringing') return 'missed'
  return 'failed'
}

/**
 * Extract label from VAPI call metadata or transcript
 */
const extractCallLabel = (call: VapiCall): CallLabel => {
  // Try to extract label from metadata
  if (call.metadata?.label) {
    const label = String(call.metadata.label).toLowerCase()
    if (['lead', 'spam', 'appointment', 'other'].includes(label)) {
      return label as CallLabel
    }
  }

  // Try to infer from transcript or metadata
  const transcript = call.transcript?.toLowerCase() || ''
  if (transcript.includes('appointment') || transcript.includes('schedule')) {
    return 'appointment'
  }
  if (transcript.includes('spam') || transcript.includes('unwanted')) {
    return 'spam'
  }
  if (transcript.includes('interested') || transcript.includes('quote') || transcript.includes('pricing')) {
    return 'lead'
  }

  return 'other'
}

/**
 * Calculate cost from VAPI call data
 */
const calculateCallCost = (call: VapiCall): number => {
  if (call.cost !== undefined) {
    return call.cost
  }

  // Calculate from cost breakdown if available
  if (call.costBreakdown) {
    return (
      (call.costBreakdown.model || 0) +
      (call.costBreakdown.voice || 0) +
      (call.costBreakdown.telephony || 0)
    )
  }

  // Default to 0 if no cost data
  return 0
}

/**
 * Calculate minutes billed from duration
 */
const calculateMinutesBilled = (call: VapiCall): number => {
  if (!call.startedAt || !call.endedAt) return 0

  const start = new Date(call.startedAt).getTime()
  const end = new Date(call.endedAt).getTime()
  const durationMs = end - start
  const durationSeconds = Math.floor(durationMs / 1000)
  const minutesBilled = durationSeconds / 60

  // Round up to nearest 0.01
  return Math.ceil(minutesBilled * 100) / 100
}

/**
 * Sync a VAPI call to our database
 */
export const syncVapiCallToDatabase = async (
  vapiCall: VapiCall,
  receptionistId: string
): Promise<string> => {
  try {
    // Calculate derived values
    const cost = calculateCallCost(vapiCall)
    const minutesBilled = calculateMinutesBilled(vapiCall)
    const label = extractCallLabel(vapiCall)
    const status = mapVapiStatusToCallStatus(vapiCall.status)

    // Extract caller number
    const callerNumber = vapiCall.customer?.number || 'Unknown'

    // Create or update call in database
    // First, check if call already exists (using VAPI call ID in metadata)
    const callData = {
      receptionist_id: receptionistId,
      caller_number: callerNumber,
      timestamp: vapiCall.startedAt || new Date().toISOString(),
      duration_seconds: vapiCall.endedAt && vapiCall.startedAt
        ? Math.floor(
            (new Date(vapiCall.endedAt).getTime() - new Date(vapiCall.startedAt).getTime()) / 1000
          )
        : 0,
      minutes_billed: minutesBilled,
      cost: cost,
      label: label,
      transcript: vapiCall.transcript || null,
      metadata: {
        vapi_call_id: vapiCall.id,
        vapi_assistant_id: vapiCall.assistantId,
        vapi_phone_number_id: vapiCall.phoneNumberId,
        status: vapiCall.status,
        ended_reason: vapiCall.endedReason,
        recording_url: vapiCall.recordingUrl,
        ...vapiCall.metadata,
      },
    }

    // In a real implementation, you'd check if call exists first
    // For now, we'll create a new one
    const call = await createCall(callData)
    return call.id
  } catch (error) {
    console.error('Error syncing VAPI call to database:', error)
    throw error
  }
}

/**
 * Sync VAPI assistant to our receptionist record
 */
export const syncVapiAssistantToReceptionist = async (
  vapiAssistant: VapiAssistant,
  receptionistId: string
): Promise<void> => {
  try {
    await updateReceptionist(receptionistId, {
      name: vapiAssistant.name || 'AI Receptionist',
      status: 'active', // If assistant exists in VAPI, it's active
    })
  } catch (error) {
    console.error('Error syncing VAPI assistant to receptionist:', error)
    throw error
  }
}

/**
 * Handle VAPI webhook events
 */
export const handleVapiWebhook = async (
  event: VapiWebhookEvent,
  receptionistId: string
): Promise<void> => {
  try {
    switch (event.type) {
      case 'call-start':
        // Call just started - we might want to create a placeholder
        console.log('Call started:', event.call.id)
        break

      case 'call-end':
      case 'hang':
        // Call ended - sync final call data
        await syncVapiCallToDatabase(event.call, receptionistId)
        break

      case 'transcript':
        // Transcript updated - update existing call
        if (event.call.transcript) {
          // Find and update call by VAPI call ID
          // This would require querying our database first
          console.log('Transcript updated for call:', event.call.id)
        }
        break

      case 'recording':
        // Recording available - update call metadata
        if (event.call.recordingUrl) {
          console.log('Recording available for call:', event.call.id)
        }
        break

      case 'status-update':
        // Status changed - update call status
        console.log('Status updated for call:', event.call.id, event.call.status)
        break

      default:
        console.log('Unhandled webhook event:', event.type)
    }
  } catch (error) {
    console.error('Error handling VAPI webhook:', error)
    throw error
  }
}

