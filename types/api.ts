/**
 * API request/response types
 */

import type { Call, CallLabel, Receptionist, Profile } from './database'

export interface UserMetrics {
  total_minutes_used: number
  total_cost: number
  cost_per_minute: number
  total_calls: number
  last_updated?: string
}

export interface ReceptionistMetrics {
  minutes_used: number
  total_cost: number
  cost_per_minute: number
  calls_handled: number
}

export interface GetCallsResponse {
  data: Call[]
  count?: number
}

export interface GetCallResponse {
  data: Call | null
}

export interface CreateCallRequest {
  receptionist_id: string
  caller_number: string
  duration_seconds?: number
  minutes_billed?: number
  cost?: number
  label?: CallLabel
  transcript?: string
  metadata?: Record<string, unknown>
}

export interface UpdateCallRequest {
  label?: CallLabel
  transcript?: string
  metadata?: Record<string, unknown>
}

export interface CreateReceptionistRequest {
  name?: string
  phone_number?: string
  status?: 'active' | 'inactive'
}

export interface UpdateReceptionistRequest {
  name?: string
  phone_number?: string
  status?: 'active' | 'inactive'
  vapi_assistant_id?: string | null
  vapi_phone_number_id?: string | null
}

export interface AuthResponse {
  user: {
    id: string
    email: string
  } | null
  error: Error | null
}

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

