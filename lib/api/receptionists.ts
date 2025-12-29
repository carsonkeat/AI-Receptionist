/**
 * Receptionist API calls
 */

import { supabase } from '@/lib/supabase/client'
import type { Receptionist } from '@/types/database'
import type { CreateReceptionistRequest, UpdateReceptionistRequest } from '@/types/api'

export const getReceptionists = async (): Promise<Receptionist[]> => {
  try {
    const { data, error } = await supabase
      .from('receptionists')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []) as Receptionist[]
  } catch (error) {
    console.error('Error fetching receptionists:', error)
    throw error
  }
}

export const getReceptionist = async (receptionistId: string): Promise<Receptionist | null> => {
  try {
    const { data, error } = await supabase
      .from('receptionists')
      .select('*')
      .eq('id', receptionistId)
      .single()

    if (error) throw error

    return data as Receptionist | null
  } catch (error) {
    console.error('Error fetching receptionist:', error)
    throw error
  }
}

export const createReceptionist = async (
  receptionist: CreateReceptionistRequest
): Promise<Receptionist> => {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('receptionists')
      .insert({
        user_id: user.id,
        name: receptionist.name || 'AI Receptionist',
        phone_number: receptionist.phone_number || null,
        status: receptionist.status || 'inactive',
      })
      .select()
      .single()

    if (error) throw error

    return data as Receptionist
  } catch (error) {
    console.error('Error creating receptionist:', error)
    throw error
  }
}

export const updateReceptionist = async (
  receptionistId: string,
  updates: UpdateReceptionistRequest
): Promise<Receptionist> => {
  try {
    const updateData: Record<string, unknown> = {}
    
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.phone_number !== undefined) updateData.phone_number = updates.phone_number
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.vapi_assistant_id !== undefined) updateData.vapi_assistant_id = updates.vapi_assistant_id
    if (updates.vapi_phone_number_id !== undefined) updateData.vapi_phone_number_id = updates.vapi_phone_number_id

    const { data, error } = await supabase
      .from('receptionists')
      .update(updateData)
      .eq('id', receptionistId)
      .select()
      .single()

    if (error) throw error

    return data as Receptionist
  } catch (error) {
    console.error('Error updating receptionist:', error)
    throw error
  }
}

export const deleteReceptionist = async (receptionistId: string): Promise<void> => {
  try {
    const { error } = await supabase.from('receptionists').delete().eq('id', receptionistId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting receptionist:', error)
    throw error
  }
}

