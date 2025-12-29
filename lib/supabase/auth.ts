/**
 * Authentication helpers
 */

import { supabase } from './client'
import { CONFIG } from '@/constants/config'
import type { AuthResponse } from '@/types/api'

export const signUp = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return {
        user: null,
        error: error as Error,
      }
    }

    return {
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email || '',
          }
        : null,
      error: null,
    }
  } catch (error) {
    return {
      user: null,
      error: error as Error,
    }
  }
}

export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Provide a more helpful error message for email confirmation
      if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
        const friendlyError = new Error(
          'Email not confirmed. Please check your email for a confirmation link, or disable email confirmation in Supabase settings.'
        )
        return {
          user: null,
          error: friendlyError,
        }
      }
      return {
        user: null,
        error: error as Error,
      }
    }

    return {
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email || '',
          }
        : null,
      error: null,
    }
  } catch (error) {
    return {
      user: null,
      error: error as Error,
    }
  }
}

export const signOut = async (): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.auth.signOut()
    return { error: error as Error | null }
  } catch (error) {
    return { error: error as Error }
  }
}

export const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'exp://localhost:8081/reset-password',
    })
    return { error: error as Error | null }
  } catch (error) {
    return { error: error as Error }
  }
}

export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export const getCurrentSession = async () => {
  try {
    // Check if Supabase is properly configured
    if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY || 
        CONFIG.SUPABASE_URL === 'https://placeholder.supabase.co' ||
        CONFIG.SUPABASE_ANON_KEY === 'placeholder-key') {
      // Return null immediately if not configured
      return null
    }

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 3000) // 3 second timeout
    })

    const sessionPromise = supabase.auth.getSession().then(({ data: { session } }) => session)

    const session = await Promise.race([sessionPromise, timeoutPromise])
    return session
  } catch (error) {
    console.error('Error getting current session:', error)
    return null
  }
}

