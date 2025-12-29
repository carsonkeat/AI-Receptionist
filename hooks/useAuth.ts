/**
 * Authentication hook
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { signIn, signUp, signOut, getCurrentUser, getCurrentSession } from '@/lib/supabase/auth'
import { getCurrentProfile } from '@/lib/api/profiles'
import { supabase } from '@/lib/supabase/client'
import { CONFIG } from '@/constants/config'
import { getStoredCredentials, clearCredentials } from '@/lib/utils/credentials'
import type { Profile } from '@/types/database'

export const useAuth = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [session, setSession] = useState<any>(null)
  const [isAttemptingAutoLogin, setIsAttemptingAutoLogin] = useState(false)

  // Get current session
  const { data: currentSession, isLoading: isSessionLoading, error: sessionError } = useQuery({
    queryKey: ['session'],
    queryFn: getCurrentSession,
    retry: false, // Don't retry if it fails (e.g., missing Supabase config)
    staleTime: Infinity, // Don't refetch unnecessarily
    gcTime: Infinity, // Keep in cache
  })

  const hasAttemptedAutoLogin = useRef(false)

  useEffect(() => {
    setSession(currentSession || null)
    setUser(currentSession?.user ? { id: currentSession.user.id, email: currentSession.user.email || '' } : null)
  }, [currentSession])

  // Auto-login with stored credentials if no session exists and "Remember Me" was enabled
  useEffect(() => {
    const attemptAutoLogin = async () => {
      // Only attempt once
      if (hasAttemptedAutoLogin.current) {
        return
      }

      // Don't attempt if Supabase is not configured
      if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY || 
          CONFIG.SUPABASE_URL === 'https://placeholder.supabase.co' ||
          CONFIG.SUPABASE_ANON_KEY === 'placeholder-key') {
        hasAttemptedAutoLogin.current = true
        return
      }

      // Wait for session to load first
      if (isSessionLoading) {
        return
      }

      // If we have a session, no need to auto-login
      if (currentSession) {
        hasAttemptedAutoLogin.current = true
        setIsAttemptingAutoLogin(false)
        return
      }

      // Try to get stored credentials
      try {
        const credentials = await getStoredCredentials()
        if (credentials) {
          setIsAttemptingAutoLogin(true)
          hasAttemptedAutoLogin.current = true
          // Attempt to sign in with stored credentials
          const result = await signIn(credentials.email, credentials.password)
          if (result.error) {
            // If auto-login fails, clear stored credentials
            console.log('Auto-login failed, clearing stored credentials')
            await clearCredentials()
          }
          setIsAttemptingAutoLogin(false)
        } else {
          hasAttemptedAutoLogin.current = true
          setIsAttemptingAutoLogin(false)
        }
      } catch (error) {
        console.error('Error during auto-login:', error)
        hasAttemptedAutoLogin.current = true
        setIsAttemptingAutoLogin(false)
      }
    }

    attemptAutoLogin()
  }, [currentSession, isSessionLoading])

  // Listen for auth changes (only if Supabase is configured)
  useEffect(() => {
    // Check if Supabase is properly configured
    if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY || 
        CONFIG.SUPABASE_URL === 'https://placeholder.supabase.co' ||
        CONFIG.SUPABASE_ANON_KEY === 'placeholder-key') {
      // Don't set up listener if not configured
      return
    }

    let subscription: { unsubscribe: () => void } | null = null
    
    try {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session)
        setUser(session?.user ? { id: session.user.id, email: session.user.email || '' } : null)
        
        // Only navigate on explicit sign in/out events, not on initial session load
        if (event === 'SIGNED_OUT') {
          queryClient.clear()
          // Use setTimeout to avoid navigation conflicts
          setTimeout(() => {
            router.replace('/(auth)/welcome')
          }, 100)
        } else if (event === 'SIGNED_IN' && session) {
          queryClient.invalidateQueries({ queryKey: ['profile'] })
          // Use setTimeout to avoid navigation conflicts
          setTimeout(() => {
            router.replace('/(tabs)/dashboard')
          }, 100)
        }
      })
      subscription = sub
    } catch (error) {
      console.error('Error setting up auth state listener:', error)
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [router, queryClient])

  // Sign in mutation
  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      // Check if Supabase is configured
      if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY || 
          CONFIG.SUPABASE_URL === 'https://placeholder.supabase.co' ||
          CONFIG.SUPABASE_ANON_KEY === 'placeholder-key') {
        throw new Error('Supabase is not configured. Please check your environment variables.')
      }
      
      const result = await signIn(email, password)
      if (result.error) {
        throw result.error
      }
      return result
    },
    onSuccess: (result) => {
      if (result.user) {
        queryClient.invalidateQueries({ queryKey: ['session'] })
        queryClient.invalidateQueries({ queryKey: ['profile'] })
        // Navigation will be handled by auth state change listener
      }
    },
  })

  // Sign up mutation
  const signUpMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      // Check if Supabase is configured
      if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY || 
          CONFIG.SUPABASE_URL === 'https://placeholder.supabase.co' ||
          CONFIG.SUPABASE_ANON_KEY === 'placeholder-key') {
        throw new Error('Supabase is not configured. Please check your environment variables.')
      }
      
      const result = await signUp(email, password)
      if (result.error) {
        throw result.error
      }
      return result
    },
    onSuccess: (result) => {
      if (result.user) {
        queryClient.invalidateQueries({ queryKey: ['session'] })
        queryClient.invalidateQueries({ queryKey: ['profile'] })
        // Navigation will be handled by auth state change listener
      }
    },
  })

  // Sign out mutation
  const signOutMutation = useMutation({
    mutationFn: async () => {
      // Clear stored credentials on sign out
      await clearCredentials()
      return signOut()
    },
    onSuccess: () => {
      hasAttemptedAutoLogin.current = false
      setIsAttemptingAutoLogin(false)
      queryClient.clear()
    },
  })

  // Get profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: getCurrentProfile,
    enabled: !!user,
  })

  // If session query fails (e.g., missing Supabase config), treat as not loading and no user
  // Also add a timeout fallback - if loading for more than 3 seconds, assume no session
  const [hasTimedOut, setHasTimedOut] = useState(false)
  
  useEffect(() => {
    if (isSessionLoading || isAttemptingAutoLogin) {
      const timer = setTimeout(() => {
        setHasTimedOut(true)
      }, 5000) // 5 second timeout (increased for auto-login)
      return () => clearTimeout(timer)
    } else {
      setHasTimedOut(false)
    }
  }, [isSessionLoading, isAttemptingAutoLogin])

  // Consider loading if session is loading OR we're attempting auto-login
  const isLoading = (isSessionLoading || isAttemptingAutoLogin) && !sessionError && !hasTimedOut

  // Wrapper functions that handle errors properly
  const handleSignIn = (args: { email: string; password: string }) => {
    signInMutation.mutate(args, {
      onError: (error) => {
        console.error('Sign in error:', error)
      },
    })
  }

  const handleSignUp = (args: { email: string; password: string }) => {
    signUpMutation.mutate(args, {
      onError: (error) => {
        console.error('Sign up error:', error)
      },
    })
  }

  return {
    user,
    session,
    profile: profile as Profile | undefined,
    isLoading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: signOutMutation.mutate,
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    signInError: signInMutation.error,
    signUpError: signUpMutation.error,
    signOutError: signOutMutation.error,
  }
}

