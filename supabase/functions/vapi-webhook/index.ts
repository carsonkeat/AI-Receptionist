/**
 * VAPI Webhook Handler - Supabase Edge Function
 * 
 * This function receives webhook events from VAPI and syncs call data to your database.
 * 
 * Deploy with:
 * supabase functions deploy vapi-webhook
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, vapi-signature',
}

interface VapiWebhookEvent {
  message?: {
    type: string
    timestamp?: number
    call?: {
      id: string
      customer?: {
        number: string
      }
      status?: string
    }
    artifact?: {
      transcript?: string
      recordingUrl?: string
      recording?: {
        stereoUrl?: string
        mono?: {
          combinedUrl?: string
        }
      }
    }
    startedAt?: string
    endedAt?: string
    endedReason?: string
    cost?: number
    costBreakdown?: Record<string, unknown>
    durationMs?: number
    durationSeconds?: number
    durationMinutes?: number
    summary?: string
  }
  call?: {
    id: string
    assistantId: string
    phoneNumberId?: string
    customer?: {
      number: string
    }
    status: string
    endedReason?: string
    startedAt?: string
    endedAt?: string
    cost?: number
    costBreakdown?: {
      model?: number
      voice?: number
      telephony?: number
    }
    transcript?: string
    recordingUrl?: string
    metadata?: Record<string, unknown>
  }
  assistant?: {
    id: string
  }
  type?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Allow unauthenticated requests (VAPI webhooks don't send auth headers)
  // This is safe because we validate the data and don't expose sensitive operations
  
  try {
    const payload: any = await req.json()
    console.log('VAPI Webhook received:', JSON.stringify(payload, null, 2).substring(0, 500))

    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Extract data from VAPI webhook format
    // VAPI sends various event types: end-of-call-report, hang, conversation-update, etc.
    const eventType = payload.message?.type || payload.type || 'unknown'
    
    // Assistant ID can be in multiple places depending on event type
    // Based on actual VAPI payload: assistant.id at root, OR message.call.assistantId
    const assistantId = payload.assistant?.id || 
                       payload.message?.assistantId ||
                       payload.message?.call?.assistantId ||  // This is where it is in transcript events!
                       payload.call?.assistantId ||
                       null
    
    // Call ID can be in multiple places
    const callId = payload.message?.call?.id || 
                   payload.call?.id || 
                   payload.message?.callId ||
                   null
    
    console.log('Extracted from payload:', {
      eventType,
      assistantId,
      callId,
      payloadKeys: Object.keys(payload),
      messageKeys: payload.message ? Object.keys(payload.message) : null
    })
    
    // Some events don't require assistant/call IDs (like assistant.started)
    // Only require them for call-related events
    const requiresIds = ['end-of-call-report', 'call-end', 'hang', 'transcript', 'conversation-update']
    
    if (requiresIds.includes(eventType)) {
      if (!assistantId) {
        console.error('No assistant ID found in webhook payload for event:', eventType)
        console.error('Payload structure:', JSON.stringify(payload, null, 2).substring(0, 1000))
        return new Response(
          JSON.stringify({ 
            error: 'No assistant ID in webhook', 
            eventType: eventType,
            payloadKeys: Object.keys(payload),
            hint: 'Check if assistant.id is in the payload'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!callId && eventType !== 'assistant.started') {
        console.error('No call ID found in webhook payload for event:', eventType)
        return new Response(
          JSON.stringify({ 
            error: 'No call ID in webhook',
            eventType: eventType 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      // For events that don't require IDs, just return success
      console.log('Event type does not require processing:', eventType)
      return new Response(
        JSON.stringify({ success: true, event: eventType, message: 'Event received but no action needed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing webhook - Event:', eventType, 'Assistant:', assistantId, 'Call:', callId)

    // Find user profile by VAPI assistant ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('vapi_assistant_id', assistantId)
      .single()

    if (profileError || !profile) {
      console.error('Profile not found for assistant:', assistantId, 'Error:', profileError)
      return new Response(
        JSON.stringify({ 
          error: 'User profile not found', 
          assistantId: assistantId,
          hint: 'Make sure you have linked the VAPI assistant ID to your user profile'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get or create receptionist for this user (calls table still uses receptionist_id)
    // Find existing receptionist for this user
    let { data: receptionist } = await supabase
      .from('receptionists')
      .select('id')
      .eq('user_id', profile.id)
      .limit(1)
      .single()

    // If no receptionist exists, create one
    if (!receptionist) {
      const { data: newReceptionist, error: createError } = await supabase
        .from('receptionists')
        .insert({
          user_id: profile.id,
          name: 'AI Receptionist',
          status: 'active',
        })
        .select('id')
        .single()

      if (createError || !newReceptionist) {
        console.error('Failed to create receptionist:', createError)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create receptionist record',
            assistantId: assistantId
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      receptionist = newReceptionist
    }

    // Handle end-of-call-report events (VAPI's final call event)
    // Also handle 'hang' events which might come separately
    if (eventType === 'end-of-call-report' || eventType === 'end-of-call-report' || eventType === 'call-end' || eventType === 'hang') {
      console.log('Processing call end event:', eventType)
      console.log('Full payload structure:', JSON.stringify({
        hasMessage: !!payload.message,
        messageKeys: payload.message ? Object.keys(payload.message) : null,
        hasCall: !!payload.call,
        hasAssistant: !!payload.assistant
      }))
      const message = payload.message || {}
      const artifact = message.artifact || {}
      
      // Extract call data from VAPI format (based on actual payload structure)
      const startedAt = message.startedAt || payload.startedAt
      const endedAt = message.endedAt || payload.endedAt
      const cost = message.cost || payload.cost || 0
      
      // Duration: VAPI provides durationSeconds as float, DB needs integer
      const durationSecondsRaw = message.durationSeconds || 
                                 (message.durationMs ? Math.floor(message.durationMs / 1000) : 0) ||
                                 calculateDurationFromDates(startedAt, endedAt)
      const durationSeconds = Math.floor(durationSecondsRaw) // Convert to integer for DB
      
      // Use durationMinutes from VAPI if available, otherwise calculate from durationSeconds
      const minutesBilled = message.durationMinutes || calculateMinutesBilled(durationSecondsRaw)
      const transcript = artifact.transcript || message.transcript || null
      const recordingUrl = artifact.recordingUrl || 
                          artifact.recording?.stereoUrl || 
                          artifact.recording?.mono?.combinedUrl || 
                          message.recordingUrl || null
      
      // Caller number: May not be present in webCall type calls
      const callerNumber = message.call?.customer?.number || 
                          payload.call?.customer?.number || 
                          'Unknown' // Database requires NOT NULL, so use 'Unknown' as default
      
      const endedReason = message.endedReason || payload.endedReason || null
      // Cost breakdown can be in multiple locations
      const costBreakdown = message.costBreakdown || 
                           message.costs || 
                           message.call?.costBreakdown ||
                           payload.call?.costBreakdown ||
                           artifact.costBreakdown ||
                           {}

      // Extract label from analysis or metadata
      // Only mark as spam if successEvaluation is false AND it's not a test call
      let label = 'other'
      const summary = message.analysis?.summary || artifact.summary || null
      const isTestCall = transcript?.toLowerCase().includes('test') || 
                        transcript?.toLowerCase().includes('testing') ||
                        summary?.toLowerCase().includes('test')
      if (!isTestCall && (message.analysis?.successEvaluation === 'false' || message.analysis?.successEvaluation === false)) {
        label = 'spam'
      } else if (isTestCall) {
        label = 'other' // Test calls should be marked as 'other', not spam
      }

      // Check if call already exists (using VAPI call ID in metadata)
      const { data: existingCalls } = await supabase
        .from('calls')
        .select('id')
        .eq('receptionist_id', receptionist.id)
        .contains('metadata', { vapi_call_id: callId })
        .limit(1)

      // Build comprehensive metadata from VAPI payload
      // Store all fields that the app displays
      const metadata: Record<string, any> = {
        vapi_call_id: callId,
        vapi_assistant_id: assistantId,
      }
      
      // Basic call info
      if (message.call?.status) metadata.status = message.call.status
      if (message.call?.type) metadata.call_type = message.call.type // 'webCall' or 'phoneCall'
      if (message.call?.phoneNumberId) metadata.vapi_phone_number_id = message.call.phoneNumberId
      if (endedReason) metadata.ended_reason = endedReason
      if (recordingUrl) metadata.recording_url = recordingUrl
      
      // Cost breakdown (detailed for Cost tab)
      // VAPI sends costs in various formats - extract all possible locations
      if (costBreakdown && Object.keys(costBreakdown).length > 0) {
        metadata.cost_breakdown = {
          // Total cost (use actual cost if breakdown total not available)
          total: costBreakdown.total !== undefined ? costBreakdown.total : cost,
          // Individual costs - check multiple possible field names
          stt: costBreakdown.stt !== undefined ? costBreakdown.stt : 0,
          llm: costBreakdown.llm !== undefined ? costBreakdown.llm : (costBreakdown.model !== undefined ? costBreakdown.model : 0),
          tts: costBreakdown.tts !== undefined ? costBreakdown.tts : (costBreakdown.voice !== undefined ? costBreakdown.voice : 0),
          vapi: costBreakdown.vapi !== undefined ? costBreakdown.vapi : 0,
          transport: costBreakdown.transport !== undefined ? costBreakdown.transport : (costBreakdown.telephony !== undefined ? costBreakdown.telephony : 0),
          // Map to app's expected structure (use actual values, not fallbacks)
          voice: costBreakdown.voice !== undefined ? costBreakdown.voice : (costBreakdown.tts !== undefined ? costBreakdown.tts : 0),
          model: costBreakdown.model !== undefined ? costBreakdown.model : (costBreakdown.llm !== undefined ? costBreakdown.llm : 0),
          telephony: costBreakdown.telephony !== undefined ? costBreakdown.telephony : (costBreakdown.vapi !== undefined ? costBreakdown.vapi : (costBreakdown.transport !== undefined ? costBreakdown.transport : 0)),
          // Analysis costs (if present in VAPI breakdown)
          analysis_summary: costBreakdown.analysis_summary !== undefined ? costBreakdown.analysis_summary : (costBreakdown.analysisSummary !== undefined ? costBreakdown.analysisSummary : 0),
          analysis_structured_output: costBreakdown.analysis_structured_output !== undefined ? costBreakdown.analysis_structured_output : (costBreakdown.analysisStructuredOutput !== undefined ? costBreakdown.analysisStructuredOutput : 0),
          analysis_success_evaluation: costBreakdown.analysis_success_evaluation !== undefined ? costBreakdown.analysis_success_evaluation : (costBreakdown.analysisSuccessEvaluation !== undefined ? costBreakdown.analysisSuccessEvaluation : 0),
        }
      } else if (cost > 0) {
        // If no breakdown but we have total cost, create a basic breakdown
        metadata.cost_breakdown = {
          total: cost,
          stt: 0,
          llm: 0,
          tts: 0,
          vapi: 0,
          transport: 0,
          voice: 0,
          model: 0,
          telephony: 0,
          analysis_summary: 0,
          analysis_structured_output: 0,
          analysis_success_evaluation: 0,
        }
      }
      
      // Analysis & outcome (for Overview tab)
      if (message.analysis?.summary) metadata.summary = message.analysis.summary
      if (message.analysis?.successEvaluation !== undefined) {
        metadata.success_evaluation = message.analysis.successEvaluation
      }
      
      // Assistant info (for Advanced tab)
      // Check multiple locations for assistant data - VAPI sends assistant object at root level
      const assistant = payload.assistant || message.assistant || artifact.assistant || message.call?.assistant
      
      // Also check artifact for assistant config (sometimes in artifact.assistantConfig)
      const assistantConfig = artifact.assistantConfig || artifact.assistant || {}
      
      if (assistant && Object.keys(assistant).length > 0) {
        // Extract from assistant object (full structure)
        metadata.assistant_info = {
          id: assistant.id || assistantId,
          name: assistant.name || 'Grace Assistant',
          // Model can be in assistant.model.model or assistant.model (string)
          model: assistant.model?.model || (typeof assistant.model === 'string' ? assistant.model : null) || assistantConfig.model?.model || null,
          model_provider: assistant.model?.provider || assistant.modelProvider || assistantConfig.model?.provider || null,
          // Voice can be in assistant.voice.voiceId or assistant.voice (string)
          voice_id: assistant.voice?.voiceId || assistant.voice?.voice_id || (typeof assistant.voice === 'string' ? assistant.voice : null) || assistantConfig.voice?.voiceId || null,
          voice_provider: assistant.voice?.provider || assistant.voiceProvider || assistantConfig.voice?.provider || null,
          // STT/Transcriber
          stt_provider: assistant.transcriber?.provider || assistant.sttProvider || assistantConfig.transcriber?.provider || null,
          stt_model: assistant.transcriber?.model || assistant.sttModel || assistantConfig.transcriber?.model || null,
        }
      } else if (assistantConfig && Object.keys(assistantConfig).length > 0) {
        // Fallback to assistantConfig from artifact
        metadata.assistant_info = {
          id: assistantId,
          name: assistantConfig.name || 'Grace Assistant',
          model: assistantConfig.model?.model || (typeof assistantConfig.model === 'string' ? assistantConfig.model : null) || null,
          model_provider: assistantConfig.model?.provider || null,
          voice_id: assistantConfig.voice?.voiceId || assistantConfig.voice?.voice_id || null,
          voice_provider: assistantConfig.voice?.provider || null,
          stt_provider: assistantConfig.transcriber?.provider || null,
          stt_model: assistantConfig.transcriber?.model || null,
        }
      } else if (assistantId) {
        // If we only have assistant ID, store defaults based on known Grace assistant config
        metadata.assistant_info = {
          id: assistantId,
          name: 'Grace Assistant',
          model: 'meta-llama/llama-4-maverick-17b-128e-instruct', // Default from your assistant
          model_provider: 'groq', // Typical provider for this model
          voice_id: 'Kylie', // Default voice
          voice_provider: 'vapi',
          stt_provider: 'deepgram', // Common STT provider
          stt_model: 'nova-3', // Common Deepgram model
        }
      }
      
      // Performance metrics (for Advanced tab - AI Stack)
      if (artifact.performanceMetrics || message.performanceMetrics) {
        const perfMetrics = artifact.performanceMetrics || message.performanceMetrics
        metadata.performance_metrics = {
          model_latency_average: perfMetrics.modelLatencyAverage || perfMetrics.model_latency_average,
          voice_latency_average: perfMetrics.voiceLatencyAverage || perfMetrics.voice_latency_average,
          transcriber_latency_average: perfMetrics.transcriberLatencyAverage || perfMetrics.transcriber_latency_average,
          turn_latency_average: perfMetrics.turnLatencyAverage || perfMetrics.turn_latency_average,
          num_assistant_interrupted: perfMetrics.numAssistantInterrupted || perfMetrics.num_assistant_interrupted || 0,
          num_user_interrupted: perfMetrics.numUserInterrupted || perfMetrics.num_user_interrupted || 0,
          turn_latencies: perfMetrics.turnLatencies || perfMetrics.turn_latencies || [],
          endpointing_latency: perfMetrics.endpointingLatency || perfMetrics.endpointing_latency,
          from_transport_latency: perfMetrics.fromTransportLatency || perfMetrics.from_transport_latency,
          to_transport_latency: perfMetrics.toTransportLatency || perfMetrics.to_transport_latency,
        }
      }
      
      // Detailed latency breakdown with timestamps from messages
      // VAPI provides message-level timestamps and durations in artifact.messages
      // Check multiple locations for messages array (artifact.messages is the primary location)
      const messages = artifact.messages || artifact.Messages || message.messages || payload.messages || []
      
      console.log('Checking for messages array:', {
        hasArtifact: !!artifact,
        artifactKeys: artifact ? Object.keys(artifact) : [],
        hasMessages: !!artifact.messages,
        messagesLength: artifact.messages ? artifact.messages.length : 0,
        messagesArrayLength: messages.length
      })
      
      if (messages && Array.isArray(messages) && messages.length > 0) {
        const latencyBreakdown: Array<{
          turn: number
          role: string
          timestamp: string
          time_relative: number
          duration?: number
          model_latency?: number
          voice_latency?: number
          transcriber_latency?: number
        }> = []
        
        // Get call start time - try multiple sources
        let callStartTime = 0
        if (startedAt) {
          try {
            callStartTime = new Date(startedAt).getTime()
          } catch {
            callStartTime = 0
          }
        }
        // Fallback to first message time if startedAt not available
        if (callStartTime === 0 && messages[0]?.time) {
          try {
            callStartTime = new Date(messages[0].time).getTime()
          } catch {
            callStartTime = 0
          }
        }
        
        messages.forEach((msg: any, index: number) => {
          // Extract timestamp from various possible fields
          // VAPI format: msg.time (timestamp), msg.secondsFromStart (relative time), msg.duration (milliseconds)
          let msgTime: number | null = null
          let timestampStr: string = ''
          let relativeTime: number = 0
          
          if (msg.time) {
            try {
              msgTime = new Date(msg.time).getTime()
              timestampStr = msg.time
            } catch {
              // Invalid date
            }
          }
          
          // Calculate relative time - VAPI provides secondsFromStart
          if (msg.secondsFromStart !== undefined && msg.secondsFromStart !== null) {
            relativeTime = typeof msg.secondsFromStart === 'number' ? msg.secondsFromStart : parseFloat(msg.secondsFromStart)
            if (msgTime === null && callStartTime > 0) {
              msgTime = callStartTime + (relativeTime * 1000)
              timestampStr = new Date(msgTime).toISOString()
            }
          } else if (msgTime !== null && callStartTime > 0) {
            relativeTime = (msgTime - callStartTime) / 1000
          }
          
          // Calculate duration - VAPI provides duration in milliseconds
          let duration: number | undefined = undefined
          if (msg.duration !== undefined && msg.duration !== null) {
            duration = typeof msg.duration === 'number' ? msg.duration / 1000 : parseFloat(msg.duration) / 1000
          } else if (msg.endTime && msgTime) {
            try {
              const endTime = typeof msg.endTime === 'number' ? msg.endTime : new Date(msg.endTime).getTime()
              duration = (endTime - msgTime) / 1000
            } catch {
              // Invalid endTime
            }
          }
          
          // Create entry if we have role or any timing info
          if (msg.role || msgTime !== null || msg.secondsFromStart !== undefined) {
            latencyBreakdown.push({
              turn: index + 1,
              role: msg.role || 'unknown',
              timestamp: timestampStr || (callStartTime > 0 ? new Date(callStartTime + (relativeTime * 1000)).toISOString() : new Date().toISOString()),
              time_relative: relativeTime,
              duration: duration,
              model_latency: msg.modelLatency || msg.model_latency || undefined,
              voice_latency: msg.voiceLatency || msg.voice_latency || undefined,
              transcriber_latency: msg.transcriberLatency || msg.transcriber_latency || undefined,
            })
          }
        })
        
        if (latencyBreakdown.length > 0) {
          metadata.latency_breakdown = latencyBreakdown
          console.log('✅ Extracted latency breakdown:', latencyBreakdown.length, 'turns')
        } else {
          console.log('⚠️ No latency breakdown extracted - messages array had', messages.length, 'messages but no timing data')
        }
      } else {
        console.log('⚠️ No messages array found - checked artifact.messages, message.messages, payload.messages')
      }
      
      // Also extract detailed latency from performanceMetrics if available
      if (artifact.performanceMetrics?.detailedLatencies || artifact.detailedLatencies) {
        const detailedLatencies = artifact.performanceMetrics?.detailedLatencies || artifact.detailedLatencies
        metadata.detailed_latencies = detailedLatencies
      }
      
      // Structured outputs (for outcome section)
      if (artifact.structuredOutputs) {
        metadata.structured_outputs = artifact.structuredOutputs
      }
      
      // Tool calls / Function calls (if any)
      if (artifact.nodes && Array.isArray(artifact.nodes)) {
        metadata.tool_calls = artifact.nodes.map((node: any) => ({
          name: node.name || node.function?.name,
          endpoint: node.endpoint || node.url,
          status: node.status,
          time_ms: node.duration || node.time_ms,
        }))
      }
      
      // Transfers (for routing section)
      if (artifact.transfers && Array.isArray(artifact.transfers) && artifact.transfers.length > 0) {
        metadata.transfers = artifact.transfers.map((transfer: any) => ({
          transferred: true,
          transferred_to: transfer.destination || transfer.number,
          transfer_time: transfer.time || startedAt,
        }))
      } else {
        metadata.transfers = []
      }
      
      // Scorecards (for diagnostics)
      if (artifact.scorecards) {
        metadata.scorecards = artifact.scorecards
      }
      
      // Variables (for integrations)
      if (artifact.variables || artifact.variableValues) {
        metadata.variables = artifact.variableValues || artifact.variables
      }

      // Ensure all required fields are present and correct types
      const callData = {
        receptionist_id: receptionist.id,
        caller_number: callerNumber || 'Unknown', // Required NOT NULL
        timestamp: startedAt || new Date().toISOString(),
        duration_seconds: Math.max(0, Math.floor(durationSeconds || 0)), // Integer required
        minutes_billed: Math.max(0, parseFloat((minutesBilled || 0).toFixed(2))), // Numeric(10,2)
        cost: Math.max(0, parseFloat((cost || 0).toFixed(4))), // Numeric(10,4)
        label: label as 'lead' | 'spam' | 'appointment' | 'other',
        transcript: transcript || null,
        metadata: metadata,
      }
      
      // Validate required fields before insert
      if (!callData.receptionist_id) {
        throw new Error('Missing receptionist_id')
      }
      if (!callData.caller_number) {
        throw new Error('Missing caller_number')
      }
      
      console.log('Call data to insert:', JSON.stringify({
        receptionist_id: callData.receptionist_id,
        caller_number: callData.caller_number,
        duration_seconds: callData.duration_seconds,
        minutes_billed: callData.minutes_billed,
        cost: callData.cost,
        label: callData.label,
        transcript_length: callData.transcript?.length || 0,
        metadata_keys: Object.keys(callData.metadata)
      }))

      try {
        if (existingCalls && existingCalls.length > 0) {
          // Update existing call
          console.log('Updating existing call:', existingCalls[0].id)
          const { error: updateError } = await supabase
            .from('calls')
            .update(callData)
            .eq('id', existingCalls[0].id)

          if (updateError) {
            console.error('Error updating call:', JSON.stringify(updateError, null, 2))
            console.error('Call data:', JSON.stringify(callData, null, 2))
            throw updateError
          }
          console.log('Call updated successfully:', existingCalls[0].id)
        } else {
          // Create new call
          console.log('Creating new call record...')
          const { data: newCall, error: insertError } = await supabase
            .from('calls')
            .insert(callData)
            .select()
            .single()

          if (insertError) {
            console.error('Error inserting call:', JSON.stringify(insertError, null, 2))
            console.error('Full error object:', insertError)
            console.error('Call data being inserted:', JSON.stringify(callData, null, 2))
            throw insertError
          }
          console.log('Call created successfully:', newCall?.id)
        }
      } catch (dbError: any) {
        console.error('Database operation failed:', dbError)
        console.error('Error message:', dbError?.message)
        console.error('Error code:', dbError?.code)
        console.error('Error details:', dbError?.details)
        console.error('Error hint:', dbError?.hint)
        throw dbError
      }
    } else if (eventType === 'transcript' || eventType === 'transcript[transcriptType="final"]' || eventType === 'conversation-update') {
      // Update transcript for existing call
      console.log('Processing transcript/conversation update:', eventType)
      const transcript = payload.message?.artifact?.transcript || 
                        payload.message?.transcript || 
                        payload.transcript ||
                        payload.message?.content ||
                        null
      
      if (transcript && callId) {
        const { data: existingCalls } = await supabase
          .from('calls')
          .select('id')
          .eq('receptionist_id', receptionist.id)
          .contains('metadata', { vapi_call_id: callId })
          .limit(1)

        if (existingCalls && existingCalls.length > 0) {
          await supabase
            .from('calls')
            .update({ transcript: transcript })
            .eq('id', existingCalls[0].id)
          console.log('Transcript updated for call:', existingCalls[0].id)
        } else {
          console.log('No existing call found for transcript update, callId:', callId)
        }
      }
    } else if (eventType === 'assistant.started' || eventType === 'phone-call-control' || eventType === 'model-output' || eventType === 'function-call' || eventType === 'transfer-update') {
      // These events don't need to create call records, just log them
      console.log('Received event (no action needed):', eventType, 'Call ID:', callId)
    } else {
      console.log('Unhandled event type:', eventType, 'Full payload keys:', Object.keys(payload))
    }

    return new Response(
      JSON.stringify({ success: true, event: eventType, callId: callId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        stack: error.stack,
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function calculateDurationFromDates(startedAt: string | undefined, endedAt: string | undefined): number {
  if (!startedAt || !endedAt) return 0
  try {
    const start = new Date(startedAt).getTime()
    const end = new Date(endedAt).getTime()
    return Math.floor((end - start) / 1000)
  } catch {
    return 0
  }
}

function calculateMinutesBilled(durationSeconds: number): number {
  const minutes = durationSeconds / 60
  // Round up to nearest 0.01 (standard billing practice)
  return Math.ceil(minutes * 100) / 100
}

