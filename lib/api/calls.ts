/**
 * Call-related API calls
 */

import { supabase } from '@/lib/supabase/client'
import type { Call, CallLabel } from '@/types/database'
import type { GetCallsResponse, GetCallResponse, CreateCallRequest, UpdateCallRequest } from '@/types/api'

export const getCalls = async (receptionistId?: string): Promise<GetCallsResponse> => {
  try {
    let query = supabase
      .from('calls')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })

    if (receptionistId) {
      query = query.eq('receptionist_id', receptionistId)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: (data || []) as Call[],
      count: count || 0,
    }
  } catch (error) {
    console.error('Error fetching calls:', error)
    throw error
  }
}

export const getCall = async (callId: string): Promise<GetCallResponse> => {
  try {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single()

    if (error) throw error

    return {
      data: data as Call | null,
    }
  } catch (error) {
    console.error('Error fetching call:', error)
    throw error
  }
}

export const createCall = async (call: CreateCallRequest): Promise<Call> => {
  try {
    const { data, error } = await supabase
      .from('calls')
      .insert({
        receptionist_id: call.receptionist_id,
        caller_number: call.caller_number,
        duration_seconds: call.duration_seconds || 0,
        minutes_billed: call.minutes_billed || 0,
        cost: call.cost || 0,
        label: call.label || 'other',
        transcript: call.transcript || null,
        metadata: call.metadata || {},
      })
      .select()
      .single()

    if (error) throw error

    return data as Call
  } catch (error) {
    console.error('Error creating call:', error)
    throw error
  }
}

export const updateCall = async (callId: string, updates: UpdateCallRequest): Promise<Call> => {
  try {
    const { data, error } = await supabase
      .from('calls')
      .update({
        label: updates.label,
        transcript: updates.transcript,
        metadata: updates.metadata,
      })
      .eq('id', callId)
      .select()
      .single()

    if (error) throw error

    return data as Call
  } catch (error) {
    console.error('Error updating call:', error)
    throw error
  }
}

export const deleteCall = async (callId: string): Promise<void> => {
  try {
    const { error } = await supabase.from('calls').delete().eq('id', callId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting call:', error)
    throw error
  }
}

export const getCallsByLabel = async (label: CallLabel): Promise<Call[]> => {
  try {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('label', label)
      .order('timestamp', { ascending: false })

    if (error) throw error

    return (data || []) as Call[]
  } catch (error) {
    console.error('Error fetching calls by label:', error)
    throw error
  }
}

