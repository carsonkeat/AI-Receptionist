/**
 * Profile/user API calls
 */

import { supabase } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      throw new Error(error.message || 'Failed to fetch profile')
    }

    return data as Profile | null
  } catch (error) {
    console.error('Error fetching profile:', error)
    // Ensure we always throw an Error instance
    if (error instanceof Error) {
      throw error
    }
    throw new Error(String(error))
  }
}

export const getCurrentProfile = async (): Promise<Profile | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const profile = await getProfile(user.id)
    
    // Debug logging
    if (__DEV__ && profile) {
      console.log('[Profile Debug] Retrieved profile:', {
        id: profile.id,
        email: profile.email,
        vapi_assistant_id: profile.vapi_assistant_id,
        vapi_assistant_id_type: typeof profile.vapi_assistant_id,
        vapi_assistant_id_length: profile.vapi_assistant_id?.length,
        vapi_assistant_id_raw: JSON.stringify(profile.vapi_assistant_id),
      })
    }
    
    return profile
  } catch (error) {
    console.error('Error fetching current profile:', error)
    return null
  }
}

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message || 'Failed to update profile')
    }

    return data as Profile
  } catch (error) {
    console.error('Error updating profile:', error)
    // Ensure we always throw an Error instance
    if (error instanceof Error) {
      throw error
    }
    throw new Error(String(error))
  }
}

/**
 * Get assistant ID for current user
 */
export const getCurrentUserAssistantId = async (): Promise<string | null> => {
  try {
    const profile = await getCurrentProfile()
    return profile?.vapi_assistant_id || null
  } catch (error) {
    console.error('Error getting current user assistant ID:', error)
    return null
  }
}

/**
 * Update assistant ID for current user
 */
export const updateUserAssistantId = async (assistantId: string | null): Promise<Profile> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    return updateProfile(user.id, { vapi_assistant_id: assistantId })
  } catch (error) {
    console.error('Error updating user assistant ID:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error(String(error))
  }
}

