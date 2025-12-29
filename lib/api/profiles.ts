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

    return getProfile(user.id)
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

