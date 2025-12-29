/**
 * Database types for Supabase
 * These types should be generated from Supabase schema using:
 * npx supabase gen types typescript --project-id <project-id> > types/database.ts
 * 
 * For now, these are manually defined based on the schema specification.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          account_id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          account_id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      receptionists: {
        Row: {
          id: string
          user_id: string
          name: string
          phone_number: string | null
          status: 'active' | 'inactive'
          vapi_assistant_id: string | null
          vapi_phone_number_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          phone_number?: string | null
          status?: 'active' | 'inactive'
          vapi_assistant_id?: string | null
          vapi_phone_number_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone_number?: string | null
          status?: 'active' | 'inactive'
          vapi_assistant_id?: string | null
          vapi_phone_number_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      calls: {
        Row: {
          id: string
          receptionist_id: string
          caller_number: string
          timestamp: string
          duration_seconds: number
          minutes_billed: number
          cost: number
          label: 'lead' | 'spam' | 'appointment' | 'other'
          transcript: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          receptionist_id: string
          caller_number: string
          timestamp?: string
          duration_seconds?: number
          minutes_billed?: number
          cost?: number
          label?: 'lead' | 'spam' | 'appointment' | 'other'
          transcript?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          receptionist_id?: string
          caller_number?: string
          timestamp?: string
          duration_seconds?: number
          minutes_billed?: number
          cost?: number
          label?: 'lead' | 'spam' | 'appointment' | 'other'
          transcript?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      get_user_metrics: {
        Args: {
          user_uuid: string
        }
        Returns: {
          total_minutes_used: number
          total_cost: number
          cost_per_minute: number
          total_calls: number
          last_updated: string
        }[]
      }
      get_receptionist_metrics: {
        Args: {
          receptionist_uuid: string
        }
        Returns: {
          minutes_used: number
          total_cost: number
          cost_per_minute: number
          calls_handled: number
        }[]
      }
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Receptionist = Database['public']['Tables']['receptionists']['Row']
export type Call = Database['public']['Tables']['calls']['Row']

export type CallLabel = 'lead' | 'spam' | 'appointment' | 'other'
export type ReceptionistStatus = 'active' | 'inactive'

